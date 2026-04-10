// Auth0 JWT Validation Middleware for Cloud Functions
// Validates Auth0 access tokens before processing requests.
// Uses JWKS (JSON Web Key Sets) for cryptographic signature verification.
//
// Usage in any Cloud Function:
//   import { validateAuth0Token } from './middleware/validateAuth.js';
//   const decoded = await validateAuth0Token(request);

import { HttpsError } from 'firebase-functions/v2/https';

// Auth0 configuration — loaded from environment
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || '';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || '';

// JWKS cache to avoid re-fetching on every request
let jwksCache = null;
let jwksCacheExpiry = 0;
const JWKS_CACHE_DURATION = 3600000; // 1 hour in ms

/**
 * Fetch JWKS (JSON Web Key Set) from Auth0.
 * Cached for 1 hour to minimize latency.
 */
async function getJwks() {
    const now = Date.now();
    if (jwksCache && now < jwksCacheExpiry) {
        return jwksCache;
    }

    const jwksUrl = `https://${AUTH0_DOMAIN}/.well-known/jwks.json`;
    const response = await fetch(jwksUrl);

    if (!response.ok) {
        console.error(`Failed to fetch JWKS from ${jwksUrl}: ${response.status}`);
        throw new HttpsError('internal', 'Authentication service unavailable');
    }

    jwksCache = await response.json();
    jwksCacheExpiry = now + JWKS_CACHE_DURATION;
    return jwksCache;
}

/**
 * Decode a base64url-encoded string.
 */
function base64UrlDecode(str) {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    return Buffer.from(padded, 'base64');
}

/**
 * Parse JWT without verification (to extract header + payload).
 */
function parseJwt(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new HttpsError('unauthenticated', 'Invalid token format');
    }

    const header = JSON.parse(base64UrlDecode(parts[0]).toString());
    const payload = JSON.parse(base64UrlDecode(parts[1]).toString());

    return { header, payload, signature: parts[2] };
}

/**
 * Verify JWT signature using Web Crypto API (available in Node 20+).
 */
async function verifyJwtSignature(token, jwk) {
    const parts = token.split('.');
    const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlDecode(parts[2]);

    // Import the RSA public key from JWK
    const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        {
            kty: jwk.kty,
            n: jwk.n,
            e: jwk.e,
            alg: 'RS256',
            ext: true,
        },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
    );

    return crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        signature,
        signedContent
    );
}

/**
 * Validate an Auth0 JWT token from a Cloud Function request.
 *
 * @param {object} request - The Cloud Function request object
 * @returns {object} The decoded JWT payload (contains sub, email, etc.)
 * @throws {HttpsError} If token is missing, expired, or invalid
 */
export async function validateAuth0Token(request) {
    // Extract the Auth0 token from the request data
    const token = request.data?.auth0Token;

    if (!token || typeof token !== 'string') {
        throw new HttpsError(
            'unauthenticated',
            'Missing Auth0 access token. Include auth0Token in request data.'
        );
    }

    // Check Auth0 domain is configured
    if (!AUTH0_DOMAIN) {
        console.error('AUTH0_DOMAIN environment variable is not set');
        throw new HttpsError('internal', 'Authentication not configured');
    }

    try {
        // 1. Parse the JWT (header + payload)
        const { header, payload } = parseJwt(token);

        // 2. Validate algorithm
        if (header.alg !== 'RS256') {
            throw new HttpsError('unauthenticated', 'Unsupported token algorithm');
        }

        // 3. Fetch JWKS and find the matching key
        const jwks = await getJwks();
        const jwk = jwks.keys.find((k) => k.kid === header.kid);

        if (!jwk) {
            throw new HttpsError(
                'unauthenticated',
                'Token signing key not found. Token may be from a different issuer.'
            );
        }

        // 4. Verify the cryptographic signature
        const isValid = await verifyJwtSignature(token, jwk);
        if (!isValid) {
            throw new HttpsError('unauthenticated', 'Invalid token signature');
        }

        // 5. Validate claims
        const now = Math.floor(Date.now() / 1000);

        // Check expiry
        if (payload.exp && payload.exp < now) {
            throw new HttpsError('unauthenticated', 'Token has expired');
        }

        // Check not-before
        if (payload.nbf && payload.nbf > now) {
            throw new HttpsError('unauthenticated', 'Token not yet valid');
        }

        // Check issuer
        const expectedIssuer = `https://${AUTH0_DOMAIN}/`;
        if (payload.iss !== expectedIssuer) {
            throw new HttpsError('unauthenticated', 'Invalid token issuer');
        }

        // Check audience (if configured)
        if (AUTH0_AUDIENCE && payload.aud) {
            const audiences = Array.isArray(payload.aud)
                ? payload.aud
                : [payload.aud];
            if (!audiences.includes(AUTH0_AUDIENCE)) {
                throw new HttpsError('unauthenticated', 'Invalid token audience');
            }
        }

        // Check subject exists
        if (!payload.sub) {
            throw new HttpsError('unauthenticated', 'Token missing subject claim');
        }

        return payload;
    } catch (err) {
        if (err instanceof HttpsError) throw err;
        console.error('Token validation error:', err);
        throw new HttpsError('unauthenticated', 'Token validation failed');
    }
}

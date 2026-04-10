import { getAuth } from 'firebase-admin/auth';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { validateAuth0Token } from './middleware/validateAuth.js';

/**
 * Mints a Firebase Custom Token so an Auth0 user can authenticate against Firebase directly.
 *
 * Security flow:
 *   1. Client sends their Auth0 access token (auth0Token)
 *   2. Server validates the JWT signature against Auth0's JWKS endpoint
 *   3. If valid, mints a Firebase Custom Token using the Auth0 subject (sub) as UID
 *   4. Client uses the custom token to sign into Firebase Auth
 *
 * Rate limiting: Cloud Functions v2 has built-in rate limiting via max instances.
 */
export const getCustomToken = onCall(
    {
        region: 'us-central1',
        maxInstances: 10,       // Prevent abuse via instance limiting
        enforceAppCheck: false, // Enable when App Check is configured
    },
    async (request) => {
        // ── Step 1: Validate the Auth0 JWT ──
        // This cryptographically verifies the token signature, expiry,
        // issuer, and audience. Throws HttpsError if invalid.
        const decoded = await validateAuth0Token(request);
        const auth0Sub = decoded.sub;

        // ── Step 2: Additional validation ──
        if (!auth0Sub || typeof auth0Sub !== 'string') {
            throw new HttpsError(
                'invalid-argument',
                'Missing or invalid Auth0 subject identifier'
            );
        }

        // Ensure sub format is valid (auth0|xxx, google-oauth2|xxx, etc.)
        if (!auth0Sub.includes('|')) {
            throw new HttpsError(
                'invalid-argument',
                'Auth0 subject must be in the format "provider|id"'
            );
        }

        try {
            // ── Step 3: Mint Firebase Custom Token ──
            const customToken = await getAuth().createCustomToken(auth0Sub);

            console.log(
                `🔐 Custom token minted for: ${auth0Sub.split('|')[0]}|***`
            );

            return { customToken };
        } catch (err) {
            console.error('Error creating custom token:', err);
            throw new HttpsError('internal', 'Unable to create custom auth token');
        }
    }
);

// Signed URL Generator — HTTPS callable Cloud Function
// Generates 1-hour expiring signed URLs for lecture notes/PDFs
// Architecture rule #7: never serve files as public links

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getStorage } from 'firebase-admin/storage';

/**
 * Client calls this with { filePath } to get a temporary download URL.
 * The function verifies auth, then generates a signed URL that expires in 1 hour.
 */
export const getSignedUrl = onCall(
    { region: 'us-central1' },
    async (request) => {
        // Must be authenticated
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Must be logged in to access files.');
        }

        const { filePath } = request.data || {};

        if (!filePath || typeof filePath !== 'string') {
            throw new HttpsError('invalid-argument', 'filePath is required and must be a string.');
        }

        // Prevent path traversal attacks
        if (filePath.includes('..') || filePath.startsWith('/')) {
            throw new HttpsError('invalid-argument', 'Invalid file path.');
        }

        // Allowlist: only serve files from approved directories
        const ALLOWED_PREFIXES = ['course-materials/', 'pending-uploads/'];
        const isAllowed = ALLOWED_PREFIXES.some((prefix) =>
            filePath.startsWith(prefix)
        );
        if (!isAllowed) {
            throw new HttpsError(
                'permission-denied',
                'Access to this file path is not permitted.'
            );
        }

        try {
            const bucket = getStorage().bucket();
            const file = bucket.file(filePath);

            // Check if file exists
            const [exists] = await file.exists();
            if (!exists) {
                throw new HttpsError('not-found', 'File not found.');
            }

            // Generate signed URL (1 hour expiry per architecture rule #7)
            const [url] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 60 * 60 * 1000, // 1 hour
            });

            return { url, expiresIn: 3600 };
        } catch (error) {
            if (error instanceof HttpsError) throw error;
            console.error('❌ Signed URL error:', error);
            throw new HttpsError('internal', 'Failed to generate download URL.');
        }
    }
);

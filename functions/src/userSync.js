// User Sync — HTTPS endpoint called by Auth0 Post-Login Action
// Creates /users/{userId} in Firestore on first login

import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Auth0 Post-Login Action calls this endpoint with user data.
 * If the user doesn't exist in Firestore yet, we create a skeleton doc.
 * On subsequent logins, we just return 200 (doc already exists).
 *
 * Expected body: { userId, email, name, picture }
 * Auth0 sends these from the Post-Login Action script.
 */
export const userSync = onRequest(
    { cors: true, region: 'us-central1' },
    async (req, res) => {
        // Only allow POST
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }

        // Validate the request has required fields
        const { userId, email, name, picture } = req.body;

        if (!userId || !email) {
            res.status(400).json({ error: 'Missing userId or email' });
            return;
        }

        try {
            const db = getFirestore();
            const userRef = db.doc(`users/${userId}`);
            const snap = await userRef.get();

            if (!snap.exists) {
                // First login — create skeleton profile
                // Full profile is completed via the onboarding form on the client
                await userRef.set({
                    nickname: name || '',
                    email: email,
                    picture: picture || null,
                    department: null,
                    school: null,
                    university: null,
                    country: 'Nigeria',
                    yearNumber: null,
                    session: null,
                    examWindowStart: null,
                    examWindowEnd: null,
                    track2Override: false,
                    createdAt: new Date(),
                });

                console.log(`✅ Created new user profile: ${userId}`);
                res.status(201).json({ message: 'User created', userId });
            } else {
                // Returning user — no action needed
                console.log(`ℹ️ User already exists: ${userId}`);
                res.status(200).json({ message: 'User exists', userId });
            }
        } catch (error) {
            console.error('❌ User sync error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

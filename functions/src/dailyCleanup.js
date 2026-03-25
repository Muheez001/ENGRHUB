// Daily Cleanup — Scheduled Cloud Function
// Runs once per day to:
// 1. Expire pending votes older than 30 days
// 2. Reset track2Override after exam window ends

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Scheduled to run daily at midnight UTC.
 * Handles two cleanup tasks per architecture rules.
 */
export const dailyCleanup = onSchedule(
    {
        schedule: '0 0 * * *', // Every day at midnight UTC
        region: 'us-central1',
        timeZone: 'UTC',
    },
    async () => {
        const db = getFirestore();
        const now = new Date();

        console.log(`🧹 Daily cleanup started at ${now.toISOString()}`);

        // ── Task 1: Expire old pending syllabi (30+ days) ──
        try {
            const expiredSnap = await db
                .collection('pendingSyllabi')
                .where('status', 'in', ['pending', 'voting'])
                .where('expiresAt', '<=', now)
                .get();

            if (!expiredSnap.empty) {
                const batch = db.batch();
                expiredSnap.docs.forEach((doc) => {
                    batch.update(doc.ref, {
                        status: 'expired',
                        expiredAt: now,
                    });
                });
                await batch.commit();
                console.log(`🗑️ Expired ${expiredSnap.size} pending syllabi`);
            } else {
                console.log('✅ No expired syllabi found');
            }
        } catch (error) {
            console.error('❌ Syllabi cleanup error:', error);
        }

        // ── Task 2: Reset track2Override for users past exam window ──
        try {
            const usersSnap = await db
                .collection('users')
                .where('track2Override', '==', true)
                .where('examWindowEnd', '<=', now)
                .get();

            if (!usersSnap.empty) {
                const batch = db.batch();
                usersSnap.docs.forEach((doc) => {
                    batch.update(doc.ref, {
                        track2Override: false,
                    });
                });
                await batch.commit();
                console.log(`🔄 Reset track2Override for ${usersSnap.size} users`);
            } else {
                console.log('✅ No track2Override resets needed');
            }
        } catch (error) {
            console.error('❌ Track2 override cleanup error:', error);
        }

        console.log('🧹 Daily cleanup complete');
    }
);

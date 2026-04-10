// castVote — Callable Cloud Function
// Replaces direct client-side updateDoc for voting on pending syllabi.
// Enforces: same-uni/dept check, self-vote prevention, duplicate vote prevention.

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Cast a vote (confirm or flag) on a pending syllabus.
 *
 * Request data:
 *   - uploadId: string — the pendingSyllabi document ID
 *   - voteType: 'confirm' | 'flag' — the type of vote
 *
 * Security checks:
 *   1. User must be authenticated (Firebase Auth)
 *   2. Syllabus must exist and have status 'voting'
 *   3. User must be from the same university + department
 *   4. User cannot vote on their own upload
 *   5. User cannot vote twice on the same syllabus
 */
export const castVote = onCall(
    {
        region: 'us-central1',
        maxInstances: 20,
    },
    async (request) => {
        const db = getFirestore();

        // ── Auth check ──
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Must be logged in to vote');
        }
        const userId = request.auth.uid;

        // ── Input validation ──
        const { uploadId, voteType } = request.data || {};

        if (!uploadId || typeof uploadId !== 'string') {
            throw new HttpsError('invalid-argument', 'Missing or invalid uploadId');
        }
        if (!['confirm', 'flag'].includes(voteType)) {
            throw new HttpsError(
                'invalid-argument',
                'voteType must be "confirm" or "flag"'
            );
        }

        // ── Fetch syllabus ──
        const syllabusRef = db.doc(`pendingSyllabi/${uploadId}`);
        const syllabusSnap = await syllabusRef.get();

        if (!syllabusSnap.exists) {
            throw new HttpsError('not-found', 'Syllabus not found');
        }

        const syllabus = syllabusSnap.data();

        // ── Status check ──
        if (syllabus.status !== 'voting') {
            throw new HttpsError(
                'failed-precondition',
                `Cannot vote on a syllabus with status "${syllabus.status}". Must be "voting".`
            );
        }

        // ── Self-vote prevention ──
        if (syllabus.uploadedBy === userId) {
            throw new HttpsError(
                'permission-denied',
                'You cannot vote on your own syllabus'
            );
        }

        // ── Same university + department check ──
        const userSnap = await db.doc(`users/${userId}`).get();
        if (!userSnap.exists) {
            throw new HttpsError(
                'failed-precondition',
                'User profile not found. Complete onboarding first.'
            );
        }

        const userProfile = userSnap.data();

        if (userProfile.university !== syllabus.universityId) {
            throw new HttpsError(
                'permission-denied',
                'You can only vote on syllabi from your own university'
            );
        }

        if (userProfile.department !== syllabus.deptId) {
            throw new HttpsError(
                'permission-denied',
                'You can only vote on syllabi from your own department'
            );
        }

        // ── Duplicate vote prevention ──
        const confirmVotes = syllabus.confirmVotes || [];
        const flagVotes = syllabus.flagVotes || [];

        if (confirmVotes.includes(userId) || flagVotes.includes(userId)) {
            throw new HttpsError(
                'already-exists',
                'You have already voted on this syllabus'
            );
        }

        // ── Cast the vote ──
        const updateField =
            voteType === 'confirm' ? 'confirmVotes' : 'flagVotes';

        await syllabusRef.update({
            [updateField]: FieldValue.arrayUnion(userId),
        });

        // Log the vote for auditing
        await db.collection('votes').add({
            uploadId,
            userId,
            voteType,
            universityId: syllabus.universityId,
            deptId: syllabus.deptId,
            votedAt: FieldValue.serverTimestamp(),
        });

        const newCount =
            voteType === 'confirm'
                ? confirmVotes.length + 1
                : flagVotes.length + 1;

        console.log(
            `🗳️ Vote cast: ${voteType} on ${uploadId} by ${userId.substring(0, 8)}... (${newCount} total ${voteType}s)`
        );

        return {
            success: true,
            voteType,
            message:
                voteType === 'confirm'
                    ? `Vote confirmed (${newCount}/3 needed)`
                    : `Flag registered (${newCount}/3 for review)`,
        };
    }
);

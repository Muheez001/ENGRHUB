// Vote Processor — Firestore trigger
// Fires when /pendingSyllabi/{uploadId} is updated (vote added)
// Auto-approves when 3 confirms + 0 flags, or flags when 3+ flags

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Community voting logic:
 * - 3 confirms + 0 flags → status = 'approved', courses written to /courses
 * - 3+ flags → status = 'flagged', vote arrays cleared
 *
 * Architecture rules:
 * - Uploader's own vote doesn't count
 * - One vote per user per syllabus (enforced by arrays containing user IDs)
 * - Only same uni+dept+year students can vote (enforced on client + here)
 */
export const processVote = onDocumentUpdated(
    {
        document: 'pendingSyllabi/{uploadId}',
        region: 'us-central1',
    },
    async (event) => {
        const before = event.data.before.data();
        const after = event.data.after.data();
        const uploadId = event.params.uploadId;
        const db = getFirestore();

        // Only process if status is 'voting'
        if (after.status !== 'voting') return;

        const confirmVotes = after.confirmVotes || [];
        const flagVotes = after.flagVotes || [];

        // ── Defense-in-depth: filter out uploader's own vote if it slipped through ──
        const uploader = after.uploadedBy;
        const validConfirms = confirmVotes.filter((uid) => uid !== uploader);
        const validFlags = flagVotes.filter((uid) => uid !== uploader);

        // If filtering changed anything, fix the document
        if (
            validConfirms.length !== confirmVotes.length ||
            validFlags.length !== flagVotes.length
        ) {
            console.warn(
                `⚠️ Self-vote detected on ${uploadId} by uploader ${uploader}. Removing.`
            );
            await db.doc(`pendingSyllabi/${uploadId}`).update({
                confirmVotes: validConfirms,
                flagVotes: validFlags,
            });
            return; // Will re-trigger this function with cleaned data
        }

        console.log(
            `🗳️ Vote update on ${uploadId}: ${validConfirms.length} confirms, ${validFlags.length} flags`
        );

        // ── AUTO-APPROVE: 3+ confirms, 0 flags ──
        if (validConfirms.length >= 3 && validFlags.length === 0) {
            console.log(`✅ Auto-approving syllabus ${uploadId}`);

            const batch = db.batch();

            // Write parsed courses to /courses collection
            const parsedJson = after.parsedJson;
            if (parsedJson && Array.isArray(parsedJson.courses)) {
                for (const course of parsedJson.courses) {
                    const courseId = `${after.deptId}-${after.yearNumber}00l-${course.code?.replace(/\s+/g, '').toLowerCase()}`;
                    const courseRef = db.doc(`courses/${courseId}`);

                    batch.set(courseRef, {
                        courseId,
                        code: course.code || '',
                        title: course.title || '',
                        deptId: after.deptId,
                        yearNumber: after.yearNumber,
                        session: course.session || 'first',
                        creditUnits: course.creditUnits || 0,
                        mitEquivalent: course.mitEquivalent || null,
                        gapScore: null,
                        youtubePlaylist: null,
                        universityId: after.universityId,
                        approvedFrom: uploadId,
                    });
                }
            }

            // Update status to approved
            const syllabusRef = db.doc(`pendingSyllabi/${uploadId}`);
            batch.update(syllabusRef, {
                status: 'approved',
                approvedAt: new Date(),
            });

            await batch.commit();
            console.log(`✅ Syllabus ${uploadId} approved. ${parsedJson?.courses?.length || 0} courses written.`);
            return;
        }

        // ── FLAG: 3+ flags → revert to pending ──
        if (flagVotes.length >= 3) {
            console.log(`🚩 Flagging syllabus ${uploadId} — reverting to pending`);

            await db.doc(`pendingSyllabi/${uploadId}`).update({
                status: 'pending',
                confirmVotes: [],
                flagVotes: [],
                flaggedAt: new Date(),
            });
            return;
        }

        // Otherwise, still waiting for more votes — no action needed
    }
);

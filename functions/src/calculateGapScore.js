// Gap Score Calculator — Firestore trigger
// Fires when topics are written under /courses/{courseId}/topics
// Recalculates gapScore = (world_only topics) / (total unique topics) × 100

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * When any topic is created, updated, or deleted under a course,
 * this function recalculates the course's gapScore.
 *
 * gapScore = percentage of topics that exist in world syllabus but NOT in Nigerian syllabus
 * Higher score = bigger gap between local and global curriculum
 */
export const calculateGapScore = onDocumentWritten(
    {
        document: 'courses/{courseId}/topics/{topicId}',
        region: 'us-central1',
    },
    async (event) => {
        const courseId = event.params.courseId;
        const db = getFirestore();

        try {
            // Fetch all topics for this course
            const topicsSnap = await db
                .collection(`courses/${courseId}/topics`)
                .get();

            if (topicsSnap.empty) {
                // No topics — reset gap score
                await db.doc(`courses/${courseId}`).update({ gapScore: null });
                return;
            }

            const topics = topicsSnap.docs.map((d) => d.data());
            const totalTopics = topics.length;

            // Count topics that are ONLY in world syllabus (not in Nigerian)
            const worldOnlyTopics = topics.filter(
                (t) => t.inWorldSyllabus === true && t.inNigerianSyllabus !== true
            ).length;

            // gapScore = (world_only / total) × 100
            const gapScore = totalTopics > 0
                ? Math.round((worldOnlyTopics / totalTopics) * 100)
                : null;

            await db.doc(`courses/${courseId}`).update({ gapScore });

            console.log(
                `📊 Gap score updated for ${courseId}: ${gapScore}% (${worldOnlyTopics}/${totalTopics} world-only)`
            );
        } catch (error) {
            console.error(`❌ Gap score calculation error for ${courseId}:`, error);
        }
    }
);

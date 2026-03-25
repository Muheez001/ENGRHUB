// Answer Checker — HTTPS callable Cloud Function
// Accepts { exerciseId, studentAnswer } → returns { correct, solution }
// The answer/solution fields are NEVER sent to the client directly (architecture rule)

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Students call this to check their exercise answers.
 * The function reads the answer from Firestore server-side,
 * compares it to the student's answer, and returns the result.
 *
 * This ensures answer/solution fields never reach the client.
 */
export const checkAnswer = onCall(
    { region: 'us-central1' },
    async (request) => {
        // Must be authenticated
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'Must be logged in to check answers.');
        }

        const { exerciseId, studentAnswer } = request.data;

        if (!exerciseId || studentAnswer === undefined) {
            throw new HttpsError('invalid-argument', 'exerciseId and studentAnswer are required.');
        }

        try {
            const db = getFirestore();
            const exerciseRef = db.doc(`exercises/${exerciseId}`);
            const snap = await exerciseRef.get();

            if (!snap.exists) {
                throw new HttpsError('not-found', 'Exercise not found.');
            }

            const exercise = snap.data();
            const correctAnswer = exercise.answer;
            const solution = exercise.solution;

            // Compare answers (case-insensitive for text, exact for numeric)
            let isCorrect = false;
            if (typeof correctAnswer === 'number') {
                isCorrect = Number(studentAnswer) === correctAnswer;
            } else {
                isCorrect = String(studentAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
            }

            // Optionally track progress
            if (isCorrect && request.auth.uid) {
                const progressRef = db.doc(`users/${request.auth.uid}/progress/${exercise.courseId}`);
                const progressSnap = await progressRef.get();

                if (progressSnap.exists) {
                    const current = progressSnap.data();
                    await progressRef.update({
                        exercisesPassed: (current.exercisesPassed || 0) + 1,
                    });
                } else {
                    await progressRef.set({
                        track1Completed: 0,
                        track2Explored: 0,
                        exercisesPassed: 1,
                    });
                }
            }

            return {
                correct: isCorrect,
                solution: solution || null,
            };
        } catch (error) {
            if (error instanceof HttpsError) throw error;
            console.error('❌ Check answer error:', error);
            throw new HttpsError('internal', 'Failed to check answer.');
        }
    }
);

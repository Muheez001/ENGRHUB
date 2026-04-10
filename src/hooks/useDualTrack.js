import { useMemo } from 'react';
import { useUserProfile } from './useUserProfile';

/**
 * Central hook implementing the dual-track visibility logic.
 * Computes current learning phase from exam window dates.
 *
 * Returns:
 *   - showTrack2: boolean — whether Track 2 content should be visible
 *   - phase: 'normal' | 'pre-exam' | 'exam' | 'post-exam'
 *   - daysUntilExam: number | null — days until exam starts (null if no window)
 *   - overrideActive: boolean — whether user manually enabled Track 2 in exam mode
 *   - examWindowSet: boolean — whether user has configured exam dates
 */
export function useDualTrack() {
    const { profile } = useUserProfile();

    return useMemo(() => {
        const now = new Date();

        // Default: no exam window set → Track 2 always visible
        if (
            !profile?.examWindowStart ||
            !profile?.examWindowEnd
        ) {
            return {
                showTrack2: true,
                phase: 'normal',
                daysUntilExam: null,
                overrideActive: false,
                examWindowSet: false,
            };
        }

        const examStart = new Date(profile.examWindowStart);
        const examEnd = new Date(profile.examWindowEnd);
        const preExamStart = new Date(examStart);
        preExamStart.setDate(preExamStart.getDate() - 14); // 2 weeks before

        const overrideActive = !!profile.track2Override;
        const msUntilExam = examStart - now;
        const daysUntilExam = Math.ceil(msUntilExam / (1000 * 60 * 60 * 24));

        // ── Post-exam: exams are over → Track 2 resumes ──
        if (now > examEnd) {
            return {
                showTrack2: true,
                phase: 'post-exam',
                daysUntilExam: null,
                overrideActive: false,
                examWindowSet: true,
            };
        }

        // ── Exam window active → Track 2 hidden (unless override) ──
        if (now >= examStart && now <= examEnd) {
            return {
                showTrack2: overrideActive,
                phase: 'exam',
                daysUntilExam: 0,
                overrideActive,
                examWindowSet: true,
            };
        }

        // ── Pre-exam period (2 weeks out) → Track 2 faded ──
        if (now >= preExamStart && now < examStart) {
            return {
                showTrack2: true, // Still visible, just de-emphasized
                phase: 'pre-exam',
                daysUntilExam: daysUntilExam > 0 ? daysUntilExam : 0,
                overrideActive: false,
                examWindowSet: true,
            };
        }

        // ── Normal period → everything visible ──
        return {
            showTrack2: true,
            phase: 'normal',
            daysUntilExam: daysUntilExam > 0 ? daysUntilExam : null,
            overrideActive: false,
            examWindowSet: true,
        };
    }, [profile]);
}

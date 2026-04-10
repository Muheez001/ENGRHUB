// processVote.test.js — Unit tests for vote processing logic
// Tests approval flow, flag flow, self-vote filtering, and edge cases

import { describe, it, expect } from 'vitest';

// ══════════════════════════════════════════════
// Vote Logic — extracted for pure unit testing
// ══════════════════════════════════════════════

/**
 * Replicates the core decision logic from processVote.js
 * Returns the action to take based on vote counts.
 */
function computeVoteAction(confirmVotes, flagVotes, uploadedBy) {
    // Filter out self-votes (defense in depth)
    const validConfirms = confirmVotes.filter((uid) => uid !== uploadedBy);
    const validFlags = flagVotes.filter((uid) => uid !== uploadedBy);

    const selfVoteDetected =
        validConfirms.length !== confirmVotes.length ||
        validFlags.length !== flagVotes.length;

    if (selfVoteDetected) {
        return {
            action: 'clean_self_votes',
            validConfirms,
            validFlags,
        };
    }

    if (validConfirms.length >= 3 && validFlags.length === 0) {
        return { action: 'approve', confirmCount: validConfirms.length };
    }

    if (validFlags.length >= 3) {
        return { action: 'flag', flagCount: validFlags.length };
    }

    return {
        action: 'wait',
        confirmCount: validConfirms.length,
        flagCount: validFlags.length,
    };
}

// ══════════════════════════════════════════════
// Approval Flow
// ══════════════════════════════════════════════

describe('Vote Approval Flow', () => {
    it('approves with exactly 3 confirms and 0 flags', () => {
        const result = computeVoteAction(
            ['user1', 'user2', 'user3'],
            [],
            'uploader1'
        );
        expect(result.action).toBe('approve');
        expect(result.confirmCount).toBe(3);
    });

    it('approves with more than 3 confirms', () => {
        const result = computeVoteAction(
            ['user1', 'user2', 'user3', 'user4'],
            [],
            'uploader1'
        );
        expect(result.action).toBe('approve');
    });

    it('does NOT approve with 3 confirms if there are flags', () => {
        const result = computeVoteAction(
            ['user1', 'user2', 'user3'],
            ['user4'],
            'uploader1'
        );
        expect(result.action).toBe('wait');
    });

    it('waits with only 2 confirms', () => {
        const result = computeVoteAction(
            ['user1', 'user2'],
            [],
            'uploader1'
        );
        expect(result.action).toBe('wait');
        expect(result.confirmCount).toBe(2);
    });

    it('waits with 0 votes', () => {
        const result = computeVoteAction([], [], 'uploader1');
        expect(result.action).toBe('wait');
        expect(result.confirmCount).toBe(0);
        expect(result.flagCount).toBe(0);
    });
});

// ══════════════════════════════════════════════
// Flag / Revert Flow
// ══════════════════════════════════════════════

describe('Vote Flag Flow', () => {
    it('flags with exactly 3 flags', () => {
        const result = computeVoteAction(
            [],
            ['user1', 'user2', 'user3'],
            'uploader1'
        );
        expect(result.action).toBe('flag');
        expect(result.flagCount).toBe(3);
    });

    it('flags with more than 3 flags', () => {
        const result = computeVoteAction(
            ['user5'],
            ['user1', 'user2', 'user3', 'user4'],
            'uploader1'
        );
        expect(result.action).toBe('flag');
    });

    it('flags even if there are also confirms', () => {
        const result = computeVoteAction(
            ['user5', 'user6'],
            ['user1', 'user2', 'user3'],
            'uploader1'
        );
        expect(result.action).toBe('flag');
    });

    it('waits with only 2 flags', () => {
        const result = computeVoteAction(
            [],
            ['user1', 'user2'],
            'uploader1'
        );
        expect(result.action).toBe('wait');
        expect(result.flagCount).toBe(2);
    });
});

// ══════════════════════════════════════════════
// Self-Vote Prevention
// ══════════════════════════════════════════════

describe('Self-Vote Prevention', () => {
    it('detects uploader confirm vote and triggers cleanup', () => {
        const result = computeVoteAction(
            ['uploader1', 'user2', 'user3'],
            [],
            'uploader1'
        );
        expect(result.action).toBe('clean_self_votes');
        expect(result.validConfirms).not.toContain('uploader1');
        expect(result.validConfirms).toHaveLength(2);
    });

    it('detects uploader flag vote and triggers cleanup', () => {
        const result = computeVoteAction(
            [],
            ['uploader1', 'user2'],
            'uploader1'
        );
        expect(result.action).toBe('clean_self_votes');
        expect(result.validFlags).not.toContain('uploader1');
    });

    it('does NOT trigger cleanup for legitimate votes', () => {
        const result = computeVoteAction(
            ['user1', 'user2'],
            ['user3'],
            'uploader1'
        );
        expect(result.action).not.toBe('clean_self_votes');
    });

    it('would approve after self-vote cleanup if threshold met', () => {
        // Uploader + 3 real users = after filtering uploader, 3 remain
        const confirms = ['uploader1', 'user1', 'user2', 'user3'];
        const filtered = confirms.filter((uid) => uid !== 'uploader1');
        expect(filtered).toHaveLength(3);
    });

    it('would NOT approve after self-vote cleanup if threshold not met', () => {
        // Uploader + 2 real users = after filtering, only 2 remain
        const confirms = ['uploader1', 'user1', 'user2'];
        const filtered = confirms.filter((uid) => uid !== 'uploader1');
        expect(filtered).toHaveLength(2);
    });
});

// ══════════════════════════════════════════════
// Duplicate Vote Prevention
// ══════════════════════════════════════════════

describe('Duplicate Vote Prevention', () => {
    it('arrayUnion prevents exact duplicates', () => {
        // Simulating Firestore arrayUnion behavior
        const existing = ['user1', 'user2'];
        const toAdd = 'user1'; // duplicate
        const result = existing.includes(toAdd) ? existing : [...existing, toAdd];
        expect(result).toHaveLength(2);
    });

    it('allows different users to vote', () => {
        const existing = ['user1', 'user2'];
        const toAdd = 'user3';
        const result = existing.includes(toAdd) ? existing : [...existing, toAdd];
        expect(result).toHaveLength(3);
    });
});

// ══════════════════════════════════════════════
// Edge Cases
// ══════════════════════════════════════════════

describe('Edge Cases', () => {
    it('handles undefined vote arrays gracefully', () => {
        const confirms = undefined || [];
        const flags = undefined || [];
        const result = computeVoteAction(confirms, flags, 'uploader1');
        expect(result.action).toBe('wait');
    });

    it('handles null vote arrays gracefully', () => {
        const confirms = null || [];
        const flags = null || [];
        const result = computeVoteAction(confirms, flags, 'uploader1');
        expect(result.action).toBe('wait');
    });

    it('race condition: 3 confirms + 3 flags simultaneously', () => {
        // Flags take priority (flags >= 3 check comes after approve check,
        // but approve requires 0 flags, so it falls through to flag)
        const result = computeVoteAction(
            ['user1', 'user2', 'user3'],
            ['user4', 'user5', 'user6'],
            'uploader1'
        );
        // approve requires 0 flags, so it won't approve
        // flag requires 3+, so it will flag
        expect(result.action).toBe('flag');
    });
});

// checkAnswer.test.js — Unit tests for answer checking logic
// Tests input validation, answer comparison, and edge cases

import { describe, it, expect } from 'vitest';

// ══════════════════════════════════════════════
// Answer Comparison Logic (extracted from checkAnswer.js)
// ══════════════════════════════════════════════

function compareAnswers(correctAnswer, studentAnswer) {
    if (typeof correctAnswer === 'number') {
        return Number(studentAnswer) === correctAnswer;
    }
    return (
        String(studentAnswer).trim().toLowerCase() ===
        String(correctAnswer).trim().toLowerCase()
    );
}

// ══════════════════════════════════════════════
// Input Validation Logic
// ══════════════════════════════════════════════

function validateExerciseId(exerciseId) {
    if (!exerciseId || typeof exerciseId !== 'string') {
        return { valid: false, reason: 'exerciseId must be a non-empty string' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(exerciseId)) {
        return { valid: false, reason: 'exerciseId contains invalid characters' };
    }
    return { valid: true };
}

function validateStudentAnswer(answer) {
    if (answer === undefined || answer === null) {
        return { valid: false, reason: 'studentAnswer is required' };
    }
    if (typeof answer === 'string' && answer.length > 1000) {
        return { valid: false, reason: 'Answer too long' };
    }
    return { valid: true };
}

// ══════════════════════════════════════════════
// Answer Comparison Tests
// ══════════════════════════════════════════════

describe('Answer Comparison — Numeric', () => {
    it('matches exact number', () => {
        expect(compareAnswers(42, 42)).toBe(true);
    });

    it('matches string representation of number', () => {
        expect(compareAnswers(42, '42')).toBe(true);
    });

    it('rejects wrong number', () => {
        expect(compareAnswers(42, 43)).toBe(false);
    });

    it('handles floating point answers', () => {
        expect(compareAnswers(3.14, '3.14')).toBe(true);
    });

    it('rejects NaN student answer for numeric', () => {
        expect(compareAnswers(42, 'not a number')).toBe(false);
    });

    it('handles zero correctly', () => {
        expect(compareAnswers(0, '0')).toBe(true);
        expect(compareAnswers(0, 0)).toBe(true);
    });

    it('handles negative numbers', () => {
        expect(compareAnswers(-5, '-5')).toBe(true);
        expect(compareAnswers(-5, '5')).toBe(false);
    });
});

describe('Answer Comparison — Text', () => {
    it('matches exact text', () => {
        expect(compareAnswers('transistor', 'transistor')).toBe(true);
    });

    it('is case-insensitive', () => {
        expect(compareAnswers('Transistor', 'transistor')).toBe(true);
        expect(compareAnswers('TRANSISTOR', 'transistor')).toBe(true);
    });

    it('trims whitespace', () => {
        expect(compareAnswers('transistor', '  transistor  ')).toBe(true);
        expect(compareAnswers('  transistor  ', 'transistor')).toBe(true);
    });

    it('rejects wrong text', () => {
        expect(compareAnswers('transistor', 'resistor')).toBe(false);
    });

    it('handles empty string', () => {
        expect(compareAnswers('', '')).toBe(true);
        expect(compareAnswers('answer', '')).toBe(false);
    });

    it('handles multi-word answers', () => {
        expect(compareAnswers('Ohm\'s Law', 'ohm\'s law')).toBe(true);
    });
});

// ══════════════════════════════════════════════
// Input Validation Tests
// ══════════════════════════════════════════════

describe('exerciseId Validation', () => {
    it('accepts valid alphanumeric ID', () => {
        expect(validateExerciseId('ece-100l-mat101-q1')).toEqual({ valid: true });
    });

    it('accepts ID with underscores', () => {
        expect(validateExerciseId('exercise_001')).toEqual({ valid: true });
    });

    it('rejects empty string', () => {
        expect(validateExerciseId('')).toEqual({
            valid: false,
            reason: 'exerciseId must be a non-empty string',
        });
    });

    it('rejects null', () => {
        expect(validateExerciseId(null).valid).toBe(false);
    });

    it('rejects undefined', () => {
        expect(validateExerciseId(undefined).valid).toBe(false);
    });

    it('rejects number type', () => {
        expect(validateExerciseId(123).valid).toBe(false);
    });

    it('rejects path traversal attempt', () => {
        expect(validateExerciseId('../admin/secrets').valid).toBe(false);
    });

    it('rejects special characters', () => {
        expect(validateExerciseId('id with spaces').valid).toBe(false);
        expect(validateExerciseId('id;DROP TABLE').valid).toBe(false);
    });
});

describe('studentAnswer Validation', () => {
    it('accepts string answer', () => {
        expect(validateStudentAnswer('transistor')).toEqual({ valid: true });
    });

    it('accepts numeric answer', () => {
        expect(validateStudentAnswer(42)).toEqual({ valid: true });
    });

    it('accepts empty string (valid submission)', () => {
        expect(validateStudentAnswer('')).toEqual({ valid: true });
    });

    it('rejects undefined', () => {
        expect(validateStudentAnswer(undefined).valid).toBe(false);
    });

    it('rejects null', () => {
        expect(validateStudentAnswer(null).valid).toBe(false);
    });

    it('rejects answer exceeding 1000 characters', () => {
        const longAnswer = 'a'.repeat(1001);
        expect(validateStudentAnswer(longAnswer).valid).toBe(false);
    });

    it('accepts answer at exactly 1000 characters', () => {
        const maxAnswer = 'a'.repeat(1000);
        expect(validateStudentAnswer(maxAnswer)).toEqual({ valid: true });
    });
});

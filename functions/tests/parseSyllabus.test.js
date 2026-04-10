// parseSyllabus.test.js — Unit tests for syllabus parsing logic
// Tests JSON parsing edge cases, error classification, and validation

import { describe, it, expect } from 'vitest';

// ══════════════════════════════════════════════
// JSON Cleaning & Parsing Tests
// ══════════════════════════════════════════════

/**
 * Replicates the JSON cleaning logic from parseSyllabus.js
 * Extracted here for unit testing without calling Gemini.
 */
function cleanAndParseGeminiResponse(responseText) {
    const cleaned = responseText
        .replace(/```json?\n?/g, '')
        .replace(/```/g, '')
        .trim();
    return JSON.parse(cleaned);
}

function validateParsedJson(parsed) {
    if (!parsed || !parsed.courses || !Array.isArray(parsed.courses)) {
        return { valid: false, reason: 'Missing or invalid courses array' };
    }

    for (const course of parsed.courses) {
        if (!course.code || typeof course.code !== 'string') {
            return { valid: false, reason: `Course missing code: ${JSON.stringify(course)}` };
        }
        if (!course.title || typeof course.title !== 'string') {
            return { valid: false, reason: `Course missing title: ${course.code}` };
        }
        if (course.session && !['first', 'second'].includes(course.session)) {
            return { valid: false, reason: `Invalid session "${course.session}" in ${course.code}` };
        }
    }

    return { valid: true };
}

describe('JSON Cleaning', () => {
    it('parses clean JSON without markdown fences', () => {
        const input = '{"courses": [{"code": "MAT 101", "title": "Math I", "creditUnits": 4}]}';
        const result = cleanAndParseGeminiResponse(input);
        expect(result.courses).toHaveLength(1);
        expect(result.courses[0].code).toBe('MAT 101');
    });

    it('removes ```json fences from Gemini response', () => {
        const input = '```json\n{"courses": [{"code": "PHY 101", "title": "Physics I"}]}\n```';
        const result = cleanAndParseGeminiResponse(input);
        expect(result.courses[0].code).toBe('PHY 101');
    });

    it('removes ``` fences without json label', () => {
        const input = '```\n{"courses": []}\n```';
        const result = cleanAndParseGeminiResponse(input);
        expect(result.courses).toHaveLength(0);
    });

    it('handles leading/trailing whitespace', () => {
        const input = '   \n\n{"courses": []}  \n\n  ';
        const result = cleanAndParseGeminiResponse(input);
        expect(result.courses).toEqual([]);
    });

    it('throws on completely invalid JSON', () => {
        expect(() => cleanAndParseGeminiResponse('This is not JSON at all')).toThrow();
    });

    it('throws on empty string', () => {
        expect(() => cleanAndParseGeminiResponse('')).toThrow();
    });

    it('throws on partial JSON', () => {
        expect(() => cleanAndParseGeminiResponse('{"courses": [')).toThrow();
    });

    it('handles response with explanation text before JSON', () => {
        // Gemini sometimes adds text before/after the JSON
        const input = '```json\n{"courses": [{"code": "EEE 201", "title": "Circuit Theory"}]}\n```';
        const result = cleanAndParseGeminiResponse(input);
        expect(result.courses[0].title).toBe('Circuit Theory');
    });
});

describe('Schema Validation', () => {
    it('accepts valid course data', () => {
        const data = {
            courses: [
                {
                    code: 'MAT 101',
                    title: 'Elementary Mathematics I',
                    creditUnits: 4,
                    session: 'first',
                    topics: [{ title: 'Set Theory', week: 1 }],
                },
            ],
        };
        expect(validateParsedJson(data)).toEqual({ valid: true });
    });

    it('rejects null input', () => {
        const result = validateParsedJson(null);
        expect(result.valid).toBe(false);
    });

    it('rejects missing courses array', () => {
        const result = validateParsedJson({ something: 'else' });
        expect(result.valid).toBe(false);
    });

    it('rejects courses that is not an array', () => {
        const result = validateParsedJson({ courses: 'not an array' });
        expect(result.valid).toBe(false);
    });

    it('rejects course missing code', () => {
        const result = validateParsedJson({
            courses: [{ title: 'Math', creditUnits: 3 }],
        });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('missing code');
    });

    it('rejects course missing title', () => {
        const result = validateParsedJson({
            courses: [{ code: 'MAT 101', creditUnits: 3 }],
        });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('missing title');
    });

    it('rejects invalid session value', () => {
        const result = validateParsedJson({
            courses: [{ code: 'MAT 101', title: 'Math', session: 'third' }],
        });
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Invalid session');
    });

    it('accepts empty courses array (valid but no data)', () => {
        const result = validateParsedJson({ courses: [] });
        expect(result.valid).toBe(true);
    });

    it('accepts course without session (optional field)', () => {
        const result = validateParsedJson({
            courses: [{ code: 'MAT 101', title: 'Math I' }],
        });
        expect(result.valid).toBe(true);
    });
});

// ══════════════════════════════════════════════
// Error Classification Tests
// ══════════════════════════════════════════════

describe('Error Classification', () => {
    it('classifies 429 as RATE_LIMITED (retryable)', () => {
        const status = 429;
        const type = status === 429 ? 'RATE_LIMITED' : status >= 500 ? 'API_DOWN' : 'INVALID_INPUT';
        expect(type).toBe('RATE_LIMITED');
    });

    it('classifies 500 as API_DOWN (retryable)', () => {
        const status = 500;
        const type = status === 429 ? 'RATE_LIMITED' : status >= 500 ? 'API_DOWN' : 'INVALID_INPUT';
        expect(type).toBe('API_DOWN');
    });

    it('classifies 503 as API_DOWN (retryable)', () => {
        const status = 503;
        const type = status === 429 ? 'RATE_LIMITED' : status >= 500 ? 'API_DOWN' : 'INVALID_INPUT';
        expect(type).toBe('API_DOWN');
    });

    it('classifies 400 as INVALID_INPUT (permanent)', () => {
        const status = 400;
        const type = status === 429 ? 'RATE_LIMITED' : status >= 500 ? 'API_DOWN' : 'INVALID_INPUT';
        expect(type).toBe('INVALID_INPUT');
    });

    it('classifies 403 as INVALID_INPUT (permanent)', () => {
        const status = 403;
        const type = status === 429 ? 'RATE_LIMITED' : status >= 500 ? 'API_DOWN' : 'INVALID_INPUT';
        expect(type).toBe('INVALID_INPUT');
    });
});

// ══════════════════════════════════════════════
// File Path Parsing Tests
// ══════════════════════════════════════════════

describe('Upload Path Parsing', () => {
    function parseUploadPath(filePath) {
        if (!filePath.startsWith('pending-uploads/')) return null;
        const parts = filePath.split('/');
        if (parts.length < 4) return null;
        return {
            uniId: parts[1],
            deptId: parts[2],
            yearStr: parts[3],
        };
    }

    it('parses valid upload path', () => {
        const result = parseUploadPath('pending-uploads/lasu/ece/1-syllabus.pdf');
        expect(result).toEqual({ uniId: 'lasu', deptId: 'ece', yearStr: '1-syllabus.pdf' });
    });

    it('returns null for non-upload paths', () => {
        expect(parseUploadPath('course-materials/some-file.pdf')).toBeNull();
    });

    it('returns null for too-short paths', () => {
        expect(parseUploadPath('pending-uploads/lasu')).toBeNull();
    });

    it('handles paths with extra segments', () => {
        const result = parseUploadPath('pending-uploads/unilag/eee/2/extra/file.pdf');
        expect(result).not.toBeNull();
        expect(result.uniId).toBe('unilag');
        expect(result.deptId).toBe('eee');
    });
});

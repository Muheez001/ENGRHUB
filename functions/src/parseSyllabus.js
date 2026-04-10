// Syllabus Parser — Storage trigger → Cloud Task worker
// Fires when a file is uploaded to /pending-uploads/
// Reads the file, calls Gemini 2.0 Flash to extract course data, writes to /pendingSyllabi
//
// Error Taxonomy:
//   RATE_LIMITED  — Gemini 429 response, retried by Cloud Tasks
//   INVALID_INPUT — File not readable or wrong format
//   PARSE_FAILURE — Gemini returned non-JSON after retry
//   API_DOWN      — Gemini API unreachable, retried by Cloud Tasks
//   INTERNAL      — Unexpected error

import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getFunctions } from 'firebase-admin/functions';

// Gemini API endpoint (2.0 Flash — free tier: 15 RPM, 1500 RPD)
const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ══════════════════════════════════════════════
// Error Classes — enables retry vs no-retry decisions
// ══════════════════════════════════════════════
class RetryableError extends Error {
    constructor(type, message) {
        super(message);
        this.name = 'RetryableError';
        this.type = type;
    }
}

class PermanentError extends Error {
    constructor(type, message) {
        super(message);
        this.name = 'PermanentError';
        this.type = type;
    }
}

// ══════════════════════════════════════════════
// Gemini API Client
// ══════════════════════════════════════════════
async function callGeminiAPI(apiKey, prompt, inlineData = null) {
    const parts = [{ text: prompt }];
    if (inlineData) {
        parts.push({ inlineData });
    }

    const startTime = Date.now();

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
            },
        }),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
        const errorText = await response.text();
        const status = response.status;

        // Rate limited — Cloud Tasks should retry
        if (status === 429) {
            throw new RetryableError(
                'RATE_LIMITED',
                `Gemini rate limited (429). Duration: ${durationMs}ms`
            );
        }

        // Server error — transient, retry
        if (status >= 500) {
            throw new RetryableError(
                'API_DOWN',
                `Gemini server error (${status}). Duration: ${durationMs}ms. Details: ${errorText}`
            );
        }

        // Client error — permanent, don't retry
        throw new PermanentError(
            'INVALID_INPUT',
            `Gemini API error (${status}): ${errorText}`
        );
    }

    const result = await response.json();

    console.log(
        `📊 Gemini call completed: ${durationMs}ms, ` +
        `tokens: ${result.usageMetadata?.totalTokenCount || 'unknown'}`
    );

    return result;
}

// ══════════════════════════════════════════════
// Get Gemini API Key — supports Secret Manager + env fallback
// ══════════════════════════════════════════════
async function getGeminiApiKey() {
    // Try GCP Secret Manager first (production)
    try {
        const { SecretManagerServiceClient } =
            await import('@google-cloud/secret-manager');
        const client = new SecretManagerServiceClient();
        const [version] = await client.accessSecretVersion({
            name: 'projects/-/secrets/GEMINI_API_KEY/versions/latest',
        });
        const key = version.payload.data.toString();
        if (key) return key;
    } catch {
        // Secret Manager not available (emulator or not configured)
    }

    // Fallback to environment variable (emulator / development)
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey) return envKey;

    throw new PermanentError(
        'INTERNAL',
        'GEMINI_API_KEY not available in Secret Manager or environment'
    );
}

// ══════════════════════════════════════════════
// Storage Trigger — enqueue parse task
// ══════════════════════════════════════════════
/**
 * Triggered when a file is uploaded to Firebase Storage.
 * Enqueues a durable Cloud Task to process parsing without memory or timeout loss.
 * Path pattern: pending-uploads/{uniId}/{deptId}/{filename}
 */
export const parseSyllabus = onObjectFinalized(
    { region: 'us-central1' },
    async (event) => {
        const filePath = event.data.name;

        // Only process files in pending-uploads/
        if (!filePath.startsWith('pending-uploads/')) return;

        // Extract metadata from path
        const parts = filePath.split('/');
        if (parts.length < 4) {
            console.error('❌ Invalid upload path:', filePath);
            return;
        }

        const queue = getFunctions().taskQueue('parseSyllabusWorker');
        await queue.enqueue({
            filePath,
            uniId: parts[1],
            deptId: parts[2],
            yearStr: parts[3],
            uploadedBy: event.data.metadata?.uploadedBy || 'unknown',
            fileSize: event.data.size || 0,
            contentType: event.data.contentType || 'unknown',
        });

        console.log(
            `📥 Parse task enqueued: ${filePath} ` +
            `(${Math.round((event.data.size || 0) / 1024)}KB, ${event.data.contentType})`
        );
    }
);

// ══════════════════════════════════════════════
// Cloud Task Worker — Gemini parsing
// ══════════════════════════════════════════════
/**
 * Worker: Parses the syllabus via Gemini 2.0 Flash.
 * Uses Cloud Tasks rateLimits to strictly enforce max 1 concurrent dispatch
 * to respect the free tier 15 RPM limits without failing.
 *
 * Error handling:
 *   - RetryableError → rethrown so Cloud Tasks retries (rate limits, server errors)
 *   - PermanentError → logged and written to Firestore as parse_failed (no retry)
 */
export const parseSyllabusWorker = onTaskDispatched(
    {
        region: 'us-central1',
        retryConfig: {
            maxAttempts: 5,
            minBackoffSeconds: 10,
            maxBackoffSeconds: 300,
        },
        rateLimits: { maxConcurrentDispatches: 1 },
    },
    async (request) => {
        const { filePath, uniId, deptId, yearStr, uploadedBy, fileSize } =
            request.data;
        const db = getFirestore();
        const startTime = Date.now();

        console.log(
            `🔄 Processing: ${filePath} | uni=${uniId} dept=${deptId} ` +
            `year=${yearStr} size=${Math.round((fileSize || 0) / 1024)}KB`
        );

        // Get API key (Secret Manager → env fallback)
        const apiKey = await getGeminiApiKey();

        try {
            // ── Download the file ──
            const bucket = getStorage().bucket();
            const file = bucket.file(filePath);

            const [exists] = await file.exists();
            if (!exists) {
                throw new PermanentError(
                    'INVALID_INPUT',
                    `File not found: ${filePath}`
                );
            }

            const [buffer] = await file.download();

            // ── Prepare content for Gemini ──
            const ext = filePath.split('.').pop().toLowerCase();
            let inlineData = null;
            let documentText = '';

            const MIME_MAP = {
                pdf: 'application/pdf',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                doc: 'application/msword',
                ppt: 'application/vnd.ms-powerpoint',
            };

            if (MIME_MAP[ext]) {
                inlineData = {
                    mimeType: MIME_MAP[ext],
                    data: buffer.toString('base64'),
                };
                documentText = `[${ext.toUpperCase()} Document Attached — ${Math.round(buffer.length / 1024)}KB]`;
            } else {
                // Fallback to text reading
                documentText = buffer.toString('utf-8').substring(0, 30000);
            }

            // ── Build prompt ──
            const prompt = `You are an academic syllabus parser. Extract course information from this document.

Return a JSON object with this exact structure:
{
  "courses": [
    {
      "code": "MAT 101",
      "title": "Elementary Mathematics I",
      "creditUnits": 4,
      "session": "first",
      "topics": [
        {
          "title": "Set Theory and Logic",
          "week": 1,
          "inNigerianSyllabus": true,
          "inWorldSyllabus": false
        }
      ]
    }
  ]
}

Rules:
- Return ONLY valid JSON, no markdown, no explanation
- "session" must be "first" or "second"
- Set inNigerianSyllabus to true for all topics (since this is a Nigerian syllabus)
- Set inWorldSyllabus to false (will be enriched later with world data)
- If you cannot extract courses, return {"courses": []}

Document content:
${documentText}`;

            // ── Call Gemini (attempt 1) ──
            const result = await callGeminiAPI(apiKey, prompt, inlineData);
            const responseText =
                result.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // ── Parse JSON response ──
            let parsedJson;
            try {
                const cleaned = responseText
                    .replace(/```json?\n?/g, '')
                    .replace(/```/g, '')
                    .trim();
                parsedJson = JSON.parse(cleaned);
            } catch {
                // ── Retry with stricter prompt ──
                console.log(
                    '⚠️ First parse failed, retrying with stricter prompt...'
                );
                const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY a JSON object, starting with { and ending with }. No other text.`;
                const retryResult = await callGeminiAPI(
                    apiKey,
                    retryPrompt,
                    inlineData
                );
                const retryText =
                    retryResult.candidates?.[0]?.content?.parts?.[0]?.text ||
                    '';

                try {
                    const retryCleaned = retryText
                        .replace(/```json?\n?/g, '')
                        .replace(/```/g, '')
                        .trim();
                    parsedJson = JSON.parse(retryCleaned);
                } catch {
                    // Both attempts failed — permanent failure
                    throw new PermanentError(
                        'PARSE_FAILURE',
                        'Gemini returned non-JSON after 2 attempts'
                    );
                }
            }

            // ── Validate structure ──
            if (!parsedJson.courses || !Array.isArray(parsedJson.courses)) {
                parsedJson = { courses: [] };
            }

            // ── Determine year number ──
            const yearNumber = parseInt(yearStr) || 1;

            // ── Handle empty results ──
            if (parsedJson.courses.length === 0) {
                await db.collection('pendingSyllabi').add({
                    universityId: uniId,
                    deptId,
                    yearNumber,
                    uploadedBy,
                    fileUrl: filePath,
                    parsedJson,
                    status: 'rejected',
                    rejectionReason: 'no_courses_found',
                    confirmVotes: [],
                    flagVotes: [],
                    createdAt: new Date(),
                    expiresAt: new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                    ),
                });
                console.log(
                    `⚠️ No courses found — rejected. Duration: ${Date.now() - startTime}ms`
                );
                return;
            }

            // ── Success — write to pendingSyllabi ──
            await db.collection('pendingSyllabi').add({
                universityId: uniId,
                deptId,
                yearNumber,
                uploadedBy,
                fileUrl: filePath,
                parsedJson,
                status: 'voting',
                confirmVotes: [],
                flagVotes: [],
                courseCount: parsedJson.courses.length,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            console.log(
                `✅ Syllabus parsed: ${parsedJson.courses.length} courses found. ` +
                `Duration: ${Date.now() - startTime}ms. Entering voting.`
            );
        } catch (error) {
            const durationMs = Date.now() - startTime;

            // Retryable errors — rethrow so Cloud Tasks retries
            if (error instanceof RetryableError) {
                console.warn(
                    `⚠️ Retryable error (${error.type}): ${error.message}. Duration: ${durationMs}ms`
                );
                throw error; // Cloud Tasks will retry
            }

            // Permanent errors — log and write failure to Firestore
            const errorType =
                error instanceof PermanentError
                    ? error.type
                    : 'INTERNAL';

            console.error(
                `❌ Permanent error (${errorType}): ${error.message}. Duration: ${durationMs}ms`
            );

            // Write failure record so the user sees feedback
            try {
                const yearNumber = parseInt(yearStr) || 1;
                await db.collection('pendingSyllabi').add({
                    universityId: uniId,
                    deptId,
                    yearNumber,
                    uploadedBy,
                    fileUrl: filePath,
                    parsedJson: null,
                    status: 'parse_failed',
                    errorType,
                    errorMessage: error.message,
                    confirmVotes: [],
                    flagVotes: [],
                    createdAt: new Date(),
                    expiresAt: new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                    ),
                });
            } catch (writeErr) {
                console.error(
                    '❌ Failed to write error record:',
                    writeErr
                );
            }
        }
    }
);

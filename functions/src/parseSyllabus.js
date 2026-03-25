// Syllabus Parser — Storage trigger
// Fires when a file is uploaded to /pending-uploads/
// Reads the file, calls Gemini 2.0 Flash to extract course data, writes to /pendingSyllabi

import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Gemini API endpoint (free tier: 15 RPM)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Rate limit queue — 4s delay between Gemini calls (architecture rule #6)
 */
let lastGeminiCall = 0;
async function rateLimitedGeminiCall(apiKey, prompt) {
    const now = Date.now();
    const timeSinceLast = now - lastGeminiCall;
    if (timeSinceLast < 4000) {
        await new Promise((resolve) => setTimeout(resolve, 4000 - timeSinceLast));
    }
    lastGeminiCall = Date.now();

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Triggered when a file is uploaded to Firebase Storage.
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

        const [, uniId, deptId, filename] = parts;
        const db = getFirestore();

        // Get Gemini API key from environment
        // In production: use GCP Secret Manager
        // In emulator: set via .env or functions config
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY not set');
            return;
        }

        try {
            // Download the file content
            const bucket = getStorage().bucket();
            const file = bucket.file(filePath);
            const [buffer] = await file.download();
            const fileContent = buffer.toString('utf-8');

            // Build the Gemini prompt
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
${fileContent.substring(0, 30000)}`;

            console.log(`🔄 Parsing syllabus: ${filename} for ${uniId}/${deptId}`);

            // Call Gemini
            const result = await rateLimitedGeminiCall(apiKey, prompt);
            const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Try to parse the JSON response
            let parsedJson;
            try {
                // Remove markdown code fences if present
                const cleaned = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                parsedJson = JSON.parse(cleaned);
            } catch {
                // Retry with stricter prompt
                console.log('⚠️ First parse failed, retrying with stricter prompt...');
                const retryPrompt = `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY a JSON object, starting with { and ending with }. No other text.`;
                const retryResult = await rateLimitedGeminiCall(apiKey, retryPrompt);
                const retryText = retryResult.candidates?.[0]?.content?.parts?.[0]?.text || '';

                try {
                    const retryCleaned = retryText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
                    parsedJson = JSON.parse(retryCleaned);
                } catch {
                    // Both attempts failed
                    console.error('❌ Parse failed after retry');
                    await db.collection('pendingSyllabi').add({
                        universityId: uniId,
                        deptId,
                        uploadedBy: event.data.metadata?.uploadedBy || 'unknown',
                        fileUrl: filePath,
                        parsedJson: null,
                        status: 'parse_failed',
                        confirmVotes: [],
                        flagVotes: [],
                        createdAt: new Date(),
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    });
                    return;
                }
            }

            // Validate: must have courses array
            if (!parsedJson.courses || !Array.isArray(parsedJson.courses)) {
                parsedJson = { courses: [] };
            }

            // Check for empty results (non-syllabus file)
            if (parsedJson.courses.length === 0) {
                await db.collection('pendingSyllabi').add({
                    universityId: uniId,
                    deptId,
                    uploadedBy: event.data.metadata?.uploadedBy || 'unknown',
                    fileUrl: filePath,
                    parsedJson,
                    status: 'rejected',
                    rejectionReason: 'no_courses_found',
                    confirmVotes: [],
                    flagVotes: [],
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });
                console.log('⚠️ No courses found — rejected');
                return;
            }

            // Success — write to pendingSyllabi with status 'voting'
            await db.collection('pendingSyllabi').add({
                universityId: uniId,
                deptId,
                yearNumber: parseInt(parts[3]) || 1,
                uploadedBy: event.data.metadata?.uploadedBy || 'unknown',
                fileUrl: filePath,
                parsedJson,
                status: 'voting',
                confirmVotes: [],
                flagVotes: [],
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            });

            console.log(`✅ Syllabus parsed: ${parsedJson.courses.length} courses found, entering voting`);
        } catch (error) {
            console.error('❌ Syllabus parser error:', error);
        }
    }
);

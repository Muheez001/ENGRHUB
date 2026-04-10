// EngHub NG — Cloud Functions Entry Point
// All server-side logic: user sync, syllabus parsing, answer checking, etc.

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin (auto-configures in emulator + deployed environments)
initializeApp();

// ── Cloud Functions ──
// Each function is defined in its own file and re-exported here.

// User sync — creates Firestore profile on first Auth0 login
export { userSync } from './src/userSync.js';

// Auth0 to Firebase bridge — mints custom Firebase tokens
export { getCustomToken } from './src/getCustomToken.js';

// Syllabus parser — triggered on Storage upload, calls Gemini
export { parseSyllabus, parseSyllabusWorker } from './src/parseSyllabus.js';

// Answer checker — HTTPS callable, validates student answers
export { checkAnswer } from './src/checkAnswer.js';

// Signed URL — HTTPS callable, generates 1-hour signed download URLs
export { getSignedUrl } from './src/getSignedUrl.js';

// Gap score — Firestore trigger, recalculates gap score when topics change
export { calculateGapScore } from './src/calculateGapScore.js';

// Vote caster — HTTPS callable, secure voting with validation
export { castVote } from './src/castVote.js';

// Vote processor — Firestore trigger, auto-approves when 3 confirms reached
export { processVote } from './src/processVote.js';

// Cleanup — scheduled daily, expires old votes + resets track2Override
export { dailyCleanup } from './src/dailyCleanup.js';

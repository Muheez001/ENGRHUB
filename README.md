# EngHub NG 🚀

**Bridging the gap between Nigerian engineering curriculum and world-class tech standards.**

EngHub NG is an intelligent learning platform ("Engineering OS") designed specifically for Nigerian university students. It maps the local COREN curriculum (Track 1) directly against global standards like MIT and Stanford (Track 2), giving students exactly what they need to pass their local exams while preparing them for global tech opportunities.

---

## 🎯 The Aim
Many engineering students in Nigeria struggle to reconcile what they are taught in class with what the global industry demands. EngHub solves this by providing a **Dual-Track Learning Engine**:
- **Track 1 (Local):** What you need to pass your exams (mapped to your specific university, department, and level).
- **Track 2 (Global):** What you actually need to build world-class systems (mapped to MIT/Stanford equivalents).

The platform uses AI (Gemini 2.0 Flash) to ingest unstructured departmental syllabi, structure them, and allow the student community to vote and verify the curriculum to unlock courses for their peers.

---

## 🛠 Tech Stack
- **Frontend:** React + Vite
- **Styling:** Custom CSS (Dark Metallic "Bento Grid" Design System)
- **Backend:** Firebase Cloud Functions (Node.js)
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage (for PDFs & Lecture Notes)
- **Authentication:** Auth0
- **AI Integration:** Google Gemini 2.0 Flash (Syllabus Parsing)

---

## 🗺️ Project Roadmap

We are building EngHub NG in 9 logical phases. **We are currently starting Phase 5.**

### ✅ Phase 1: Foundation
- Scaffolded project and initialized Firebase.
- Created `firestore.rules` and seeded database with ECE department data.
- Built the global CSS design system (bento grid layout).

### ✅ Phase 2: Authentication
- Integrated Auth0 for secure login.
- Built the 3-step university onboarding flow.
- Configured Cloud Functions to sync Auth0 users to Firestore.

### ✅ Phase 3: Frontend Shell
- Built adaptive sidebar navigation and fully responsive layout.
- Implemented dashboard widgets, live clock, and dark/light mode toggle.
- Created all primary page routes and placeholder components.

### ✅ Phase 4: Cloud Functions Backend
- Deployed all server-side logic (Node.js).
- Built Gemini syllabus parsing function.
- Built Answer Checker and Secure URL generators.
- Built automated vote processing and daily cleanup tasks.
- Fully running locally via Firebase Emulators.

### 🟡 Phase 5: Syllabus Ingestion Pipeline [IN PROGRESS]
- Build the scraper pipeline (World-class vs. Nigerian syllabi).
- Build the UI for students to upload their PDF syllabi.
- Connect the upload flow to trigger Gemini and extract courses.

### 🔜 Future Phases
- **Phase 6: Dual-Track Learning Engine** — Side-by-side local vs. global curriculum views, exam window filters.
- **Phase 7: Community Trust & Voting** — Let students vote to approve uploaded syllabi before they go live.
- **Phase 8: Content Delivery & Exercises** — Video lectures, PDF notes, and automated exercise grading.
- **Phase 9: Polish & Deploy** — Performance audits, testing, and production deployment.

---

## 🚀 Getting Started (Local Development)

1. **Clone the repo**
   ```bash
   git clone https://github.com/Muheez001/ENGRHUB.git
   cd ENGRHUB
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your Auth0 and Firebase API keys. Ensure `VITE_USE_EMULATORS=true` for local development.

4. **Start the Emulators & Vite Server**
   ```bash
   # In terminal 1:
   firebase emulators:start

   # In terminal 2:
   npm run dev
   ```

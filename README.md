# AI Resume & ATS Analyzer

An enterprise-ready AI resume evaluation and ATS optimization engine. Upload a resume (PDF, Word DOCX, or TXT) and paste a target job description to get a comprehensive multi-dimensional ATS score, an interactive keyword gap checklist with placement tips, quantified bullet rewrites, and instant tailored resume generation.

Powered by native structured JSON output across **Groq**, **Anthropic Claude**, and **OpenAI**.

---

## Key Features

- **Advanced Portfolio Features:**
  - **Single-Command Monorepo Setup:** Boot both backend and frontend concurrently with a single `npm run dev` from the repository root.
  - **PDF & Markdown Report Export:** Download complete interview-prep audit sheets in GitHub-flavored Markdown (`.md`) or print-optimized PDF with custom page-break formatting.
  - **Resume Version History:** Automatically logs revision snapshots (`v1`, `v2`, `v3`...) with local persistence to track score progression over time.
  - **Side-by-Side Version Comparison:** Compare any two versions side-by-side with overall score delta (`e.g. v1: 62% → v2: 88% (+26% Gain)`), dimension-by-dimension shifts, and newly resolved keywords.

- **Modern UI & UX Enhancements:**
  - **Interactive Drag-and-Drop Dropzone:** Seamless file uploader with glowing drop state, extension badges (PDF, DOCX, TXT), file size display, and clear/replace actions.
  - **Quick Demo Presets:** Pre-loaded sample resumes and job descriptions (*Senior Full-Stack Engineer*, *AI / ML Engineer*) for instant 1-click evaluation without searching for files.
  - **Step-by-Step Animated Loading Pipeline:** Multi-phase progress indicator guiding users through document parsing, keyword matching, score calculation, and bullet rewriting.
  - **Visual Radial Progress Gauge:** Circular SVG gauge with animated stroke indicator and color-coded alignment tiers (*Exceptional*, *Strong Candidate*, *Moderate Fit*, *High Risk*).
  - **Tabbed Results Architecture:** Organized tabs for **Overview**, **Skills Breakdown**, **Bullet Rewrites**, **Full Audit Report**, and **Tailor My Resume**.
  - **One-Click Copy & Toast Notifications:** Floating slide-up toast notification system confirming clipboard copy for individual rewrites, headline, summary, and bulk bullets.
  - **Printable Full Audit Compliance Sheet:** Comprehensive ATS criteria weights table, section parseability audit, and priority action roadmap with print-to-PDF support.

- **Multi-Dimensional ATS Scoring:**
  - **Overall Match Score:** Weighted composite score (0–100) reflecting true alignment.
  - **Skills Match:** Direct hard and functional skills alignment against job requirements.
  - **Experience & Seniority Fit:** Seniority level, years of experience, and leadership scope.
  - **Quantifiable Impact Score:** Presence of measurable metrics, percentages, dollar values, and scale.
  - **ATS Formatting & Readability:** Parseability, standard section headings, and clean keyword density.

- **Multi-Format Document Parsing:**
  - Seamless text extraction across **PDF** (`pdf-parse`), **Microsoft Word (.docx)** (`mammoth`), and plain text (`.txt`).
  - Protected by a 5MB upload limit, MIME-type and extension validation, and 30,000-character payload sanitization.

- **Interactive Keyword Gap Checklist:**
  - Missing skills categorized into **Required** (core must-haves) vs. **Nice-to-Have** (preferred qualifications).
  - Concrete **Placement Tips** indicating where and how to integrate keywords naturally into resume bullets.
  - Interactive checkboxes with live counter so candidates can address gaps in real time.

- **"Tailor My Resume" Generator (`/api/tailor`):**
  - Generates an ATS-optimized professional headline and executive summary tailored specifically to the target role.
  - Produces 4–6 tailored experience bullets with quantified impact.
  - Highlights strategic positioning rationale explaining how the adjustments beat the ATS filter.
  - One-click copy buttons with instant feedback toasts.

- **Reliable Structured Output Architecture:**
  - Uses native JSON Mode (`response_format: { type: "json_object" }`) on Groq and OpenAI.
  - Robust JSON isolation that strips code fences and automatically retries with strict schema enforcement on malformed outputs.
  - Multi-provider flexibility: auto-detects `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, or `OPENAI_API_KEY`.

---

## Tech Stack

- **Monorepo:** Concurrently, npm workspaces
- **Frontend:** React 18, Vite 5, Tailwind CSS, LocalStorage Persistence
- **Backend:** Node.js, Express, Multer
- **Parsers:** `pdf-parse` (PDF), `mammoth` (DOCX)
- **AI Providers:** Groq (`llama-3.3-70b-versatile` / `openai/gpt-oss-120b`), Anthropic (`claude-3-5-sonnet`), OpenAI (`gpt-4o-mini`)

---

## Quickstart & Local Setup

### Single-Command Startup (Recommended)
From the repository root:
```bash
# 1. Install all dependencies across workspace
npm run install:all
npm install

# 2. Configure server environment
cp ai-resume-analyzer/server/.env.example ai-resume-analyzer/server/.env
# Add your GROQ_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY to server/.env

# 3. Boot both Backend and Frontend concurrently
npm run dev
```

The app will launch at:
- **Frontend Client:** `http://localhost:5173`
- **Backend Server:** `http://localhost:4000`

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Boots Express backend (port 4000) and Vite frontend (port 5173) simultaneously |
| `npm run install:all` | Installs dependencies for both `server` and `client` sub-packages |
| `npm run dev:server` | Runs the Express server in watch mode |
| `npm run dev:client` | Runs the Vite client development server |
| `npm run build` | Builds the client production bundle |
| `npm run start` | Starts the production Express server |

---

## API Endpoints

### `POST /api/analyze`
Accepts `multipart/form-data` with `resume` (file) and `jobDescription` (string).
Returns:
```json
{
  "match_score": 82,
  "score_breakdown": {
    "skills_match": 85,
    "experience_fit": 80,
    "quantifiable_impact": 75,
    "ats_readability": 90
  },
  "matched_skills": ["React", "Node.js", "Docker"],
  "missing_skills": ["Kubernetes", "GraphQL"],
  "keyword_checklist": [
    {
      "skill": "Kubernetes",
      "type": "required",
      "status": "missing",
      "tip": "Highlight any container orchestration or CI/CD deployment experience in Project 2."
    }
  ],
  "weak_bullets": [
    {
      "original": "Worked on APIs for user authentication.",
      "issue": "Lacks scale, metrics, and technical specifics.",
      "rewrite": "Engineered secure OAuth2/JWT authentication microservices supporting 150K+ daily active users with 99.98% uptime."
    }
  ],
  "summary": "Strong engineering fit with solid backend background..."
}
```

### `POST /api/tailor`
Accepts `multipart/form-data` or JSON `{ resumeText, jobDescription }`.
Returns:
```json
{
  "ats_headline": "Senior Full-Stack Engineer | Distributed Systems & Cloud Architecture",
  "tailored_summary": "Results-driven Senior Full-Stack Engineer with 5+ years building scalable distributed services...",
  "core_competencies": ["Node.js", "React", "TypeScript", "AWS", "Microservices"],
  "tailored_bullets": [ ... ],
  "tailoring_strategy": "Highlights distributed systems latency optimizations to directly align with the core JD requirements."
}
```

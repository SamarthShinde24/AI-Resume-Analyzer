# AI Resume & ATS Analyzer

An enterprise-ready AI resume evaluation and ATS optimization engine. Upload a resume (PDF, Word DOCX, or TXT) and paste a target job description to get a comprehensive multi-dimensional ATS score, an interactive keyword gap checklist with placement tips, quantified bullet rewrites, and instant tailored resume generation.

Powered by native structured JSON output across **Groq**, **Anthropic Claude**, and **OpenAI**.

---

## Key Features

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

- **Frontend:** React 18, Vite 5, Tailwind CSS
- **Backend:** Node.js, Express, Multer
- **Parsers:** `pdf-parse` (PDF), `mammoth` (DOCX)
- **AI Providers:** Groq (`llama-3.3-70b-versatile`), Anthropic (`claude-3-5-sonnet`), OpenAI (`gpt-4o-mini`)

---

## Local Setup

### 1. Backend Setup
```bash
cd ai-resume-analyzer/server
npm install
cp .env.example .env
```

Configure your preferred LLM provider in `server/.env`:
```env
PORT=4000
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd ai-resume-analyzer/client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and automatically proxies `/api` requests to the Express server on port 4000.

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

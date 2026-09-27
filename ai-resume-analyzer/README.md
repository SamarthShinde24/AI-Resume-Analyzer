# AI Resume Analyzer

Upload a resume and a job description, and get back a structured match score, skill-gap breakdown, and bullet-point rewrite suggestions — powered by a real LLM call with structured JSON output, not just prompt-wrapping.

## How it works

1. User uploads a resume (PDF/txt) and pastes a job description in the React UI.
2. The Express backend extracts plain text from the PDF (`pdf-parse`).
3. The extracted resume text + job description are sent to Claude with a prompt that forces structured JSON output (score, matched/missing skills, weak bullets with rewrites).
4. The response is parsed server-side; if the model returns malformed JSON, the backend automatically retries once with a stricter instruction before failing.
5. The frontend renders the score, skill gaps, and rewrite suggestions.

## Why structured output matters

Asking an LLM "review this resume" gives you an essay you have to re-parse by hand. Forcing a strict JSON schema (with retry-on-failure) is what makes this usable as an actual tool instead of a chat wrapper — it's the difference between "I called an API" and "I built something that handles LLM output reliability."

## Tech stack

- **Frontend:** React + Vite + Tailwind
- **Backend:** Node.js + Express
- **LLM:** Claude API (`claude-sonnet-4-6`)
- **PDF parsing:** pdf-parse

## Local setup

### Backend
```bash
cd server
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend on port 4000.

## Future improvements

- Add an embedding-based similarity score (Claude/OpenAI embeddings) as a secondary, non-LLM validation of the match score.
- Persist analysis history in SQLite so users can compare resume versions over time.
- Support `.docx` uploads via `mammoth`.
- Add a "tailor my resume" mode that outputs a full rewritten resume, not just flagged bullets.

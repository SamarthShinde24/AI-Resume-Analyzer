import { Router } from "express";

const router = Router();

export const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "AI Resume & ATS Analyzer API",
    version: "1.0.0",
    description:
      "Enterprise REST API specification for AI resume analysis, multi-dimensional ATS scoring, deterministic TF-IDF semantic embeddings, cover letter generation, and user synchronization.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local Development Server",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "System Health & Database Diagnostic",
        description: "Returns server status and SQLite database connection stats.",
        responses: {
          200: { description: "Server is healthy and connected to database." },
        },
      },
    },
    "/api/analyze": {
      post: {
        summary: "Comprehensive Resume & ATS Analysis",
        description: "Evaluates resume file buffer (.pdf, .docx, .txt) against target job description.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  resume: { type: "string", format: "binary" },
                  jobDescription: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Analysis completed with scores, keyword checklist, and bullet rewrites." },
          400: { description: "Missing resume or job description." },
        },
      },
    },
    "/api/batch-screen": {
      post: {
        summary: "Recruiter Batch Resume Screening (RBAC Protected)",
        description: "Screens up to 15 resumes simultaneously against 1 job description. Restricted to accounts with role 'recruiter' or 'admin'.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Ranked candidate leaderboard with semantic scores and ATS health." },
          401: { description: "Missing or invalid Bearer token." },
          403: { description: "Forbidden: Account lacks recruiter or admin role." },
        },
      },
    },
    "/api/export-pdf": {
      post: {
        summary: "Native Binary PDF Tailored Resume Export (pdfkit)",
        description: "Compiles an ATS-compliant, executive PDF document with AI bullet rewrites applied directly on the server.",
        responses: {
          200: { description: "Binary PDF document stream (application/pdf)." },
          400: { description: "Missing or invalid resume text." },
        },
      },
    },
    "/api/export-audit-pdf": {
      post: {
        summary: "Native Binary PDF ATS Audit Sheet Export (pdfkit)",
        description: "Generates an executive, recruiter-grade ATS Audit Sheet with multi-dimensional scores, keyword gap checklist, and rewrite matrix.",
        responses: {
          200: { description: "Binary PDF document stream (application/pdf)." },
          400: { description: "Missing audit result data." },
        },
      },
    },
    "/api/rescore-live": {
      post: {
        summary: "Instant Live Resume Re-Scoring",
        description: "Sub-10ms deterministic recalculation for the in-browser split-screen editor.",
        responses: {
          200: { description: "Live score, newly resolved keywords, and updated checklist." },
        },
      },
    },
    "/api/scrape-job": {
      post: {
        summary: "Job Posting URL Web Scraper",
        description: "Scrapes and parses public job descriptions from Greenhouse, Lever, LinkedIn, or Indeed.",
        responses: {
          200: { description: "Cleaned job title, company name, and description." },
        },
      },
    },
    "/api/auth/register": {
      post: {
        summary: "Register New User Account",
        description: "Creates user in SQLite with bcrypt-hashed password and issues JWT token.",
        responses: {
          201: { description: "User registered with auth token." },
          400: { description: "Email already in use or invalid input." },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Authenticate User Session",
        description: "Validates credentials and returns JWT bearer token.",
        responses: {
          200: { description: "Login successful with token." },
          401: { description: "Invalid email or password." },
        },
      },
    },
    "/api/user/sync-local": {
      post: {
        summary: "Local Storage to Cloud SQLite Sync",
        description: "Atomic transaction migrating browser localStorage snapshots and Kanban applications into cloud database.",
        responses: {
          200: { description: "Bulk sync completed successfully." },
          401: { description: "Unauthorized." },
        },
      },
    },
  },
};

router.get("/spec.json", (req, res) => {
  res.json(OPENAPI_SPEC);
});

router.get("/", (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Explorer - AI Resume & ATS Analyzer</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --subtext: #94a3b8;
      --primary: #6366f1;
      --get: #0ea5e9;
      --post: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    header { margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; }
    h1 { font-size: 1.8rem; font-weight: 800; color: #fff; }
    p { color: var(--subtext); font-size: 0.9rem; margin-top: 0.5rem; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-right: 0.5rem; }
    .badge-get { background: rgba(14, 165, 233, 0.2); color: var(--get); border: 1px solid var(--get); }
    .badge-post { background: rgba(16, 185, 129, 0.2); color: var(--post); border: 1px solid var(--post); }
    .endpoint { background: var(--card); border: 1px solid var(--border); border-radius: 1rem; padding: 1.25rem; margin-bottom: 1rem; transition: transform 0.1s; }
    .endpoint:hover { border-color: var(--primary); }
    .endpoint-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .path { font-family: monospace; font-size: 1rem; font-weight: 700; color: #fff; }
    .summary { font-size: 0.85rem; color: var(--subtext); }
    .links { margin-top: 2rem; text-align: center; font-size: 0.85rem; color: var(--subtext); }
    .links a { color: var(--primary); text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 AI Resume & ATS Analyzer API Explorer</h1>
      <p>Interactive REST API specification and endpoint playground for developers.</p>
    </header>

    <div class="endpoint">
      <div class="endpoint-header">
        <div><span class="badge badge-get">GET</span><span class="path">/health</span></div>
      </div>
      <div class="summary">Returns server health, uptime, and SQLite database diagnostics.</div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <div><span class="badge badge-post">POST</span><span class="path">/api/analyze</span></div>
      </div>
      <div class="summary">Multi-dimensional ATS scoring, keyword gaps, and AI bullet rewrites (PDF/DOCX/TXT).</div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <div><span class="badge badge-post">POST</span><span class="path">/api/batch-screen</span></div>
      </div>
      <div class="summary">Recruiter Mode: screen up to 15 candidate resumes simultaneously against a single JD.</div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <div><span class="badge badge-post">POST</span><span class="path">/api/export-pdf</span></div>
      </div>
      <div class="summary">Server-side binary PDF generator (pdfkit) for tailored resumes with AI rewrites.</div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <div><span class="badge badge-post">POST</span><span class="path">/api/export-audit-pdf</span></div>
      </div>
      <div class="summary">Server-side binary PDF generator (pdfkit) for comprehensive ATS compliance audit sheets.</div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <div><span class="badge badge-post">POST</span><span class="path">/api/rescore-live</span></div>
      </div>
      <div class="summary">Zero-latency deterministic live re-scoring for the in-browser resume editor.</div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <div><span class="badge badge-post">POST</span><span class="path">/api/scrape-job</span></div>
      </div>
      <div class="summary">Scrape and sanitize public job postings from Greenhouse, Lever, Indeed, and LinkedIn.</div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <div><span class="badge badge-post">POST</span><span class="path">/api/auth/register</span></div>
      </div>
      <div class="summary">Register user account with bcrypt password hashing and JWT token issuance.</div>
    </div>

    <div class="endpoint">
      <div class="endpoint-header">
        <div><span class="badge badge-post">POST</span><span class="path">/api/user/sync-local</span></div>
      </div>
      <div class="summary">Migrate localStorage analyses and Kanban applications to cloud SQLite.</div>
    </div>

    <div class="links">
      <p>Raw OpenAPI 3.0 Schema: <a href="/api/docs/spec.json">/api/docs/spec.json</a></p>
    </div>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export default router;

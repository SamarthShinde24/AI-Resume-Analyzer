---
name: automated-testing
description: Operational runbook for running, maintaining, and expanding the automated unit and integration test suite (Vitest + Supertest) covering document parsing, semantic vector math, ATS traps, and REST API routes.
---

# Automated Testing: Vitest & Supertest Runbook

This skill provides testing guidelines, test suite organization, mocking recipes, and CI verification procedures for the **AI Resume & ATS Analyzer**.

---

## 1. Test Architecture Overview

The project uses **Vitest** as the test runner paired with **Supertest** for HTTP API integration testing.

```
ai-resume-analyzer/server/
├── vitest.config.js                    # Global test configuration
└── tests/
    ├── unit/
    │   ├── pdfParser.test.js           # Multi-format document parser & corrupt buffer isolation
    │   ├── semanticEngine.test.js      # N-gram tokenization & TF-IDF cosine similarity
    │   └── atsTrapDetector.test.js     # Section headers, pronoun audits, & score deduction rules
    └── integration/
        └── api.test.js                 # Supertest REST API coverage (/health, /api/auth, /api/analyze, /api/docs)
```

---

## 2. Quick Command Reference

| Action | Command | Scope |
| :--- | :--- | :--- |
| **Run All Tests** | `npm test` | Executes all 26 unit and integration tests |
| **Watch Mode** | `npm --prefix ai-resume-analyzer/server run test -- --watch` | Re-runs affected tests on file save |
| **Run Specific Suite** | `npx vitest run tests/unit/pdfParser.test.js` | Runs single test file |
| **Coverage Report** | `npx vitest run --coverage` | Generates line & branch coverage metrics |

---

## 3. Test Suites & Coverage Inventory

### 3.1 Document Parser Unit Tests (`tests/unit/pdfParser.test.js`)
- **Plain Text Extraction:** Verifies UTF-8 extraction from `.txt` files.
- **Markdown Extraction:** Validates headline and bullet point parsing from `.md`.
- **Corrupt PDF Buffer Isolation:** Feeds malformed non-PDF byte buffers into `extractResumeText()` and asserts clean rejection without process crash.
- **Corrupt DOCX Buffer Isolation:** Validates `mammoth` handles invalid zip archives gracefully.
- **Zero-Byte Buffer:** Verifies empty buffer input returns an empty string without throwing unhandled exceptions.

### 3.2 Semantic Vector Engine Unit Tests (`tests/unit/semanticEngine.test.js`)
- **Technical Tokenization:** Ensures bigrams (`ci cd`, `react native`, `system design`) and punctuation-sensitive tech symbols (`node.js`, `c++`, `.net`) are preserved.
- **High-Alignment Score:** Verifies that strong keyword overlap between candidate and job description yields a score $\ge 80\%$.
- **Divergence Score:** Asserts unrelated domains (e.g., pastry chef vs. Kubernetes platform engineer) produce scores $< 40\%$.
- **Edge Cases:** Handles empty resume or empty job description strings with safe default scores.

### 3.3 ATS Trap Detector Unit Tests (`tests/unit/atsTrapDetector.test.js`)
- **Section Integrity:** Flags missing standard headers (`EXPERIENCE`, `EDUCATION`, `SKILLS`) and verifies appropriate score deductions.
- **Grammar & Tone Audit:** Detects excessive first-person pronouns (`I`, `me`, `my`, `we`) and flags `pronoun_overuse` warnings.
- **Compliant Baseline:** Asserts that structured resumes with contact headers and quantified bullets score $\ge 90\%$ with zero critical traps.

### 3.4 API Route Integration Tests (`tests/integration/api.test.js`)
- **`/health`:** Returns 200 with SQLite WAL database connection status.
- **`/api/docs` & `/api/docs/spec.json`:** Validates interactive HTML API Explorer and OpenAPI 3.0 schema.
- **`/api/auth/register` & `/api/auth/login`:** Tests bcrypt password verification, duplicate email rejections, and JWT token issuance.
- **`/api/auth/me`:** Validates protected session retrieval with Bearer tokens and 401 unauthorized rejections.
- **`/api/analyze` Payload Validation:** Asserts 400 when resume file or job description is omitted.
- **`/api/rescore-live`:** Tests instant real-time live score updates and keyword delta tracking.
- **`/api/user/sync-local`:** Validates atomic bulk migration of local storage analyses and Kanban applications to the cloud SQLite database.

---

## 4. Writing New Tests: Mocking & Recipes

### 4.1 Creating Synthetic File Buffers for Upload Tests
Use Node's native `Buffer.from()` to construct synthetic file uploads in Supertest without creating physical disk files:

```javascript
import request from "supertest";
import app from "../../index.js";

it("POST /api/analyze accepts plain text resume", async () => {
  const resumeBuffer = Buffer.from("Senior Software Engineer with React and Node.js experience.", "utf-8");

  const res = await request(app)
    .post("/api/analyze")
    .attach("resume", resumeBuffer, "resume.txt")
    .field("jobDescription", "Looking for Senior React and Node.js Developer.");

  expect(res.status).toBe(200);
});
```

### 4.2 Authenticated Route Testing Helper
When testing protected endpoints under `/api/user/*`, generate an ephemeral user token in `beforeAll` or inline:

```javascript
const userRes = await request(app)
  .post("/api/auth/register")
  .send({ email: `test_${Date.now()}@example.com`, password: "password123" });

const token = userRes.body.token;

const protectedRes = await request(app)
  .get("/api/user/history")
  .set("Authorization", `Bearer ${token}`);

expect(protectedRes.status).toBe(200);
```

---

## 5. CI Pipeline Integration

Tests execute autonomously on GitHub Actions on every push and PR across Node.js versions (`20.x` and `22.x`) via `.github/workflows/ci.yml`.

Ensure that:
1. All tests remain **deterministic** (avoid relying on live network calls to external LLM providers during automated test runs).
2. Database tests use isolated IDs or in-memory / temporary test fixtures to prevent cross-test contamination.

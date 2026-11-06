# Antigravity Workspace Skills (`.agents/skills/`)

This directory houses the domain-specific **Agent Skills** tailored to the **AI Resume & ATS Analyzer** repository. These skills serve as progressive disclosure runbooks, automated procedural guides, and architectural references for developers and autonomous coding assistants (Google Antigravity, Claude, Copilot, etc.).

---

## Workspace Skills Index

| Skill Name | Directory | Primary Triggers & Capabilities |
| :--- | :--- | :--- |
| **`ats-skills-engine`** | [`.agents/skills/ats-skills-engine/SKILL.md`](./skills/ats-skills-engine/SKILL.md) | Fine-tuning LLM prompts, hybrid vector cosine weights (`0.65*LLM + 0.35*Cosine`), smoothed TF-IDF bigrams, and ATS parseability trap heuristics. |
| **`automated-testing`** | [`.agents/skills/automated-testing/SKILL.md`](./skills/automated-testing/SKILL.md) | Executing and extending the 26-test Vitest + Supertest suite, generating PDF/DOCX mock buffers, corrupt file fault-tolerance, and CI matrix execution. |
| **`production-deploy`** | [`.agents/skills/production-deploy/SKILL.md`](./skills/production-deploy/SKILL.md) | Multi-stage Docker builds, `docker-compose.yml` 1-click startup, SQLite volume backup and restore procedures (`better-sqlite3`), and cloud hosting. |
| **`security-hardening`** | [`.agents/skills/security-hardening/SKILL.md`](./skills/security-hardening/SKILL.md) | 5MB upload limit validation, 30,000-character payload sanitization, bcrypt 10-round hashing, JWT session authorization, and SQLite SQL-injection immunity. |

---

## Detailed Skill Specifications

### 1. ATS Skills Engine (`ats-skills-engine`)
- **Location:** [`.agents/skills/ats-skills-engine/SKILL.md`](./skills/ats-skills-engine/SKILL.md)
- **Scope:**
  - Hybrid scoring formula: $\text{Final Score} = \text{round}(0.65 \times S_{\text{LLM}} + 0.35 \times S_{\text{Cosine}})$.
  - TF-IDF vectorization with sub-linear TF scaling and technical bigram tokens (`machine learning`, `ci cd`, `tailwind css`).
  - ATS parseability trap detector heuristics: contact info checks, section header detection, pronoun deductions, and passive voice penalties.
  - LLM prompt engineering guidelines and strict JSON schema enforcement (`response_format: { type: "json_object" }`).

### 2. Automated Testing Suite (`automated-testing`)
- **Location:** [`.agents/skills/automated-testing/SKILL.md`](./skills/automated-testing/SKILL.md)
- **Scope:**
  - Vitest test inventory across document parsers (`parsers.test.js`), ATS heuristics (`ats-engine.test.js`), database models (`database.test.js`), and API integration (`api.test.js`).
  - Synthetic buffer generation for PDF header simulations and zero-byte corrupt file assertions.
  - Supertest in-memory Express server integration without port conflicts.
  - GitHub Actions CI matrix troubleshooting (`.github/workflows/ci.yml`).

### 3. Production Deployment & DevOps (`production-deploy`)
- **Location:** [`.agents/skills/production-deploy/SKILL.md`](./skills/production-deploy/SKILL.md)
- **Scope:**
  - 2-stage multi-stage `Dockerfile`: Stage 1 compiles Vite React client into static assets; Stage 2 builds an Alpine Node.js runtime with native C++ compilation tools for `better-sqlite3`.
  - `docker-compose.yml` orchestration with persistent SQLite volume (`ai_resume_sqlite_data`).
  - Online database backup via SQLite VACUUM INTO and live health inspection (`GET /api/health`).
  - Cloud platform deploy recipes (Render, Fly.io, Railway, DigitalOcean).

### 4. Security Hardening & Input Sanitization (`security-hardening`)
- **Location:** [`.agents/skills/security-hardening/SKILL.md`](./skills/security-hardening/SKILL.md)
- **Scope:**
  - Defense-in-depth threat model for document uploads and web scrapers.
  - Multer 5MB file size boundary enforcement and MIME-type filtering.
  - 30,000-character text truncation preventing ReDoS and LLM prompt injection / context exhaustion.
  - Prepared SQL statements (`better-sqlite3`) providing zero SQL injection surface.
  - Bcrypt (10 salt rounds) password encryption and JWT Bearer token authentication middleware.
  - Sliding window rate limiting (`express-rate-limit`), Helmet HTTP security headers (CSP, nosniff, frameguard), and Role-Based Access Control (RBAC) gating.

---

## Skill Architecture Standard

Each skill follows the standard Antigravity YAML frontmatter and structural hierarchy:

```markdown
---
name: skill-name
description: High-level overview and activation criteria for when the assistant should load this runbook.
---

# Title

## When to Use This Skill
## Architectural Blueprint & Formulas
## Implementation Recipes & Code Examples
## Verification & Testing Checklists
## Common Traps & Troubleshooting
```

## How Skills Are Loaded

- **Automatic Progressive Discovery:** Antigravity scans `.agents/skills/**/SKILL.md` within the workspace root. When a user asks about testing, deployment, security, or ATS algorithms, the corresponding skill is activated into context.
- **Developer Runbooks:** Developers can refer directly to these markdown guides when extending API routes, adding parsers, configuring Docker environments, or hardening endpoint security.

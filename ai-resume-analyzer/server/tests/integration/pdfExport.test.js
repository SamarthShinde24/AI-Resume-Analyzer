import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../index.js";

describe("Native Binary PDF Export Integration Tests (pdfkit)", () => {
  const sampleResume = `Jane Doe
jane.doe@example.com | 555-4321 | New York, NY

PROFESSIONAL SUMMARY
Senior Cloud Backend Architect with 7 years of distributed systems engineering.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, Go, Python
Cloud & DevOps: Docker, Kubernetes, AWS (ECS, S3, RDS), Terraform, CI/CD

EXPERIENCE
Lead Infrastructure Engineer | Apex Systems | 2022 - Present
• Engineered multi-region Kubernetes clusters supporting 300K requests/min.
• Automated deployment pipelines reducing release failure rates by 60%.

Software Engineer | Nexus Labs | 2019 - 2022
• Developed REST and gRPC microservices with Node.js and PostgreSQL.

EDUCATION
B.S. Software Engineering | Columbia University | 2019`;

  const sampleRewrites = [
    {
      original: "Engineered multi-region Kubernetes clusters supporting 300K requests/min.",
      rewrite:
        "Architected enterprise-grade multi-region Kubernetes clusters processing 300K+ RPM with 99.999% reliability.",
    },
  ];

  const sampleAuditResult = {
    match_score: 91,
    score_breakdown: {
      skills_match: 94,
      experience_fit: 90,
      quantifiable_impact: 88,
      ats_readability: 92,
    },
    matched_skills: ["TypeScript", "Docker", "Kubernetes", "AWS", "PostgreSQL"],
    missing_skills: ["GraphQL"],
    keyword_checklist: [
      {
        skill: "GraphQL",
        type: "nice_to_have",
        status: "missing",
        tip: "Incorporate schema design and query optimization into experience bullets.",
      },
    ],
    weak_bullets: sampleRewrites,
    summary:
      "Exceptional technical alignment for Staff Cloud Infrastructure Engineer with top-tier ATS formatting compliance.",
  };

  describe("POST /api/export-pdf (Tailored Resume PDF)", () => {
    it("returns 200 and binary application/pdf with %PDF header", async () => {
      const res = await request(app)
        .post("/api/export-pdf")
        .send({
          resumeText: sampleResume,
          weakBullets: sampleRewrites,
          candidateName: "Jane Doe",
          autoApplyRewrites: true,
        })
        .responseType("blob");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.headers["content-disposition"]).toContain("Jane_Doe.pdf");

      const buffer = Buffer.from(res.body);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("returns 400 when resumeText is missing or shorter than 40 chars", async () => {
      const res = await request(app)
        .post("/api/export-pdf")
        .send({
          resumeText: "Too short",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/resume text is missing or too short/i);
    });
  });

  describe("POST /api/export-audit-pdf (ATS Compliance Audit Sheet PDF)", () => {
    it("returns 200 and binary application/pdf with %PDF header", async () => {
      const res = await request(app)
        .post("/api/export-audit-pdf")
        .send({
          result: sampleAuditResult,
          meta: {
            roleTitle: "Staff Cloud Architect",
            candidateName: "Jane Doe",
            fileName: "Jane_Doe_Resume.pdf",
            date: "2026-11-07",
          },
        })
        .responseType("blob");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.headers["content-disposition"]).toContain("ATS_Audit_Report_Staff_Cloud_Architect.pdf");

      const buffer = Buffer.from(res.body);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("returns 400 when result data is missing", async () => {
      const res = await request(app)
        .post("/api/export-audit-pdf")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/audit result data is required/i);
    });
  });
});

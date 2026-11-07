import { describe, it, expect } from "vitest";
import {
  generateTailoredPdf,
  generateAuditSheetPdf,
  streamToBuffer,
} from "../../services/pdfGenerator.js";
import PDFDocument from "pdfkit";

describe("Server-Side PDF Generator Unit Tests (pdfGenerator.js)", () => {
  const sampleResumeText = `Alex Morgan
alex.morgan@example.com | 555-0192 | linkedin.com/in/alexmorgan | github.com/alexmorgan

PROFESSIONAL SUMMARY
Senior Full-Stack Engineer with 6+ years of experience designing scalable microservices.

TECHNICAL SKILLS
Languages & Frameworks: JavaScript, TypeScript, React, Node.js, Express, Tailwind CSS
Databases & Cloud: PostgreSQL, SQLite, Redis, Docker, AWS (ECS, S3, CloudWatch)

WORK EXPERIENCE
Senior Software Engineer | Acme Cloud Corp | 2021 - Present
• Built APIs for user authentication and dashboard syncing.
• Maintained database queries and improved performance across all tables.
• Led sprint planning and code review meetings for engineering team.

Software Engineer | Beta Startup | 2018 - 2021
• Developed responsive web applications using React and Redux.
• Created automated unit tests using Vitest and Jest.

EDUCATION
B.S. in Computer Science | State University | 2018`;

  const sampleWeakBullets = [
    {
      original: "Built APIs for user authentication and dashboard syncing.",
      rewrite:
        "Architected secure OAuth2/JWT authentication microservices supporting 120K+ MAU with 99.99% uptime.",
    },
    {
      original: "Maintained database queries and improved performance across all tables.",
      rewrite:
        "Optimized PostgreSQL connection pooling and composite indexing, reducing P95 query latency by 42%.",
    },
  ];

  const sampleAuditResult = {
    match_score: 84,
    score_breakdown: {
      skills_match: 88,
      experience_fit: 82,
      quantifiable_impact: 78,
      ats_readability: 90,
    },
    matched_skills: ["React", "Node.js", "Docker", "PostgreSQL", "TypeScript"],
    missing_skills: ["Kubernetes", "GraphQL", "CI/CD"],
    keyword_checklist: [
      {
        skill: "Kubernetes",
        type: "required",
        status: "missing",
        tip: "Highlight container orchestration in Project 1.",
      },
      {
        skill: "GraphQL",
        type: "nice_to_have",
        status: "missing",
        tip: "Add any schema design experience in Acme Corp.",
      },
    ],
    weak_bullets: sampleWeakBullets,
    summary:
      "Strong engineering fit with demonstrated backend and cloud competencies. High ATS parseability score.",
  };

  describe("generateTailoredPdf", () => {
    it("generates a valid binary PDF buffer starting with %PDF- header", async () => {
      const buffer = await generateTailoredPdf({
        resumeText: sampleResumeText,
        weakBullets: sampleWeakBullets,
        candidateName: "Alex Morgan",
        autoApplyRewrites: true,
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("handles plain resume text without rewrites or candidate name", async () => {
      const buffer = await generateTailoredPdf({
        resumeText: "Simple resume content without bullets or contact info.",
        weakBullets: [],
        autoApplyRewrites: false,
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("throws an error when resumeText is missing or empty", async () => {
      await expect(generateTailoredPdf({ resumeText: "" })).rejects.toThrow(
        /resume text is required/i
      );
      await expect(generateTailoredPdf({ resumeText: null })).rejects.toThrow(
        /resume text is required/i
      );
    });
  });

  describe("generateAuditSheetPdf", () => {
    it("generates a valid binary PDF buffer for ATS audit report", async () => {
      const buffer = await generateAuditSheetPdf({
        result: sampleAuditResult,
        meta: {
          roleTitle: "Staff Software Engineer",
          candidateName: "Alex Morgan",
          fileName: "Alex_Morgan_Resume.pdf",
          date: "2026-11-07",
        },
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("handles partial audit result with fallback defaults", async () => {
      const buffer = await generateAuditSheetPdf({
        result: {
          match_score: 65,
        },
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("throws an error when result object is missing", async () => {
      await expect(generateAuditSheetPdf({ result: null })).rejects.toThrow(
        /audit result object is required/i
      );
    });
  });

  describe("streamToBuffer", () => {
    it("collects PDF stream chunks into a single Buffer", async () => {
      const doc = new PDFDocument();
      const bufferPromise = streamToBuffer(doc);
      doc.text("Test stream to buffer");
      doc.end();

      const buffer = await bufferPromise;
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    });
  });
});

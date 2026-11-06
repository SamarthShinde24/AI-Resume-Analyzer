import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../index.js";
import { dbRepository, ROLES } from "../../services/db.js";
import { generateToken } from "../../services/authService.js";
import express from "express";
import { createCustomRateLimiter } from "../../middleware/rateLimiter.js";

describe("Production Security Hardening & RBAC Integration Tests", () => {
  describe("HTTP Header Security (Helmet)", () => {
    it("enforces Content Security Policy (CSP) headers", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.headers["content-security-policy"]).toBeDefined();
      expect(res.headers["content-security-policy"]).toContain("default-src 'self'");
    });

    it("prevents MIME-type sniffing with X-Content-Type-Options: nosniff", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("hardens iframe security with X-Frame-Options: DENY", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["x-frame-options"]).toBe("DENY");
    });
  });

  describe("Rate Limiting (express-rate-limit)", () => {
    it("includes standard RateLimit headers on auth endpoints", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@example.com", password: "password123" });

      // Even on failed login, rate limit headers must be provided
      expect(res.headers["ratelimit-limit"]).toBeDefined();
      expect(res.headers["ratelimit-remaining"]).toBeDefined();
    });

    it("blocks excessive requests with HTTP 429 when sliding window limit is exceeded", async () => {
      // Test sliding window logic using our rate limiter factory
      const testApp = express();
      const testLimiter = createCustomRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: "Sliding window rate limit reached.",
      });

      testApp.get("/test-limit", testLimiter, (req, res) => {
        res.json({ ok: true });
      });

      const agent = request(testApp);
      // First 3 requests should pass
      for (let i = 0; i < 3; i++) {
        const res = await agent.get("/test-limit");
        expect(res.status).toBe(200);
      }

      // 4th request must be blocked with HTTP 429
      const blockedRes = await agent.get("/test-limit");
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.error).toContain("Sliding window rate limit reached");
    });
  });

  describe("Role-Based Access Control (RBAC)", () => {
    const timestamp = Date.now();
    const seekerEmail = `seeker_${timestamp}@example.com`;
    const recruiterEmail = `recruiter_${timestamp}@example.com`;
    const adminEmail = `admin_${timestamp}@example.com`;

    let seekerToken = null;
    let recruiterToken = null;
    let adminToken = null;

    it("registers user with default 'job_seeker' role when no role is specified", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: seekerEmail,
          password: "password123",
          name: "Standard Seeker",
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe(ROLES.JOB_SEEKER);
      seekerToken = res.body.token;
    });

    it("registers user with 'recruiter' role when explicitly requested", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: recruiterEmail,
          password: "password123",
          name: "Tech Recruiter",
          role: ROLES.RECRUITER,
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe(ROLES.RECRUITER);
      recruiterToken = res.body.token;
    });

    it("registers user with 'admin' role when requested", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: adminEmail,
          password: "password123",
          name: "System Administrator",
          role: ROLES.ADMIN,
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe(ROLES.ADMIN);
      adminToken = res.body.token;
    });

    it("defaults invalid roles to 'job_seeker'", async () => {
      const invalidEmail = `invalid_role_${timestamp}@example.com`;
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: invalidEmail,
          password: "password123",
          name: "Hacker Role",
          role: "super_root_user_999",
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe(ROLES.JOB_SEEKER);
    });

    it("login returns user role and encodes it into JWT", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: recruiterEmail,
          password: "password123",
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe(ROLES.RECRUITER);
      expect(res.body.token).toBeDefined();
    });

    describe("Batch Screening RBAC Gating (/api/batch-screen)", () => {
      const sampleJd = "Senior Backend Engineer with Node.js, Express, Docker, and PostgreSQL expertise.";
      const sampleResumeBuffer = Buffer.from(
        "Candidate Alex Morgan\nEmail: alex@example.com\nSkills: Node.js, Express, Docker, PostgreSQL\nExperience: 5 years backend development.",
        "utf-8"
      );

      it("rejects unauthenticated requests with HTTP 401", async () => {
        const res = await request(app)
          .post("/api/batch-screen")
          .field("jobDescription", sampleJd)
          .attach("resumes", sampleResumeBuffer, "alex_resume.txt");

        expect(res.status).toBe(401);
        expect(res.body.error).toContain("Authentication required");
      });

      it("rejects 'job_seeker' role with HTTP 403 Forbidden", async () => {
        const res = await request(app)
          .post("/api/batch-screen")
          .set("Authorization", `Bearer ${seekerToken}`)
          .field("jobDescription", sampleJd)
          .attach("resumes", sampleResumeBuffer, "alex_resume.txt");

        expect(res.status).toBe(403);
        expect(res.body.error).toContain("restricted");
        expect(res.body.currentRole).toBe(ROLES.JOB_SEEKER);
      });

      it("authorizes 'recruiter' role and processes batch screening successfully", async () => {
        const res = await request(app)
          .post("/api/batch-screen")
          .set("Authorization", `Bearer ${recruiterToken}`)
          .field("jobDescription", sampleJd)
          .attach("resumes", sampleResumeBuffer, "alex_resume.txt");

        expect(res.status).toBe(200);
        expect(res.body.summary).toBeDefined();
        expect(res.body.summary.total_screened).toBe(1);
        expect(res.body.leaderboard).toHaveLength(1);
        expect(res.body.leaderboard[0].candidate_name).toContain("Alex Morgan");
      });

      it("authorizes 'admin' role and processes batch screening successfully", async () => {
        const res = await request(app)
          .post("/api/batch-screen")
          .set("Authorization", `Bearer ${adminToken}`)
          .field("jobDescription", sampleJd)
          .attach("resumes", sampleResumeBuffer, "alex_resume.txt");

        expect(res.status).toBe(200);
        expect(res.body.summary).toBeDefined();
        expect(res.body.summary.total_screened).toBe(1);
      });
    });
  });
});

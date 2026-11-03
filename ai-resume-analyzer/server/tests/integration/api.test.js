import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../index.js";

describe("API Route Integration Tests (Supertest)", () => {
  it("GET /health returns 200 with database status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.database.connected).toBe(true);
  });

  describe("Developer API Documentation (/api/docs)", () => {
    it("GET /api/docs returns 200 and renders HTML API Explorer", async () => {
      const res = await request(app).get("/api/docs");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/html");
      expect(res.text).toContain("API Explorer");
    });

    it("GET /api/docs/spec.json returns 200 with OpenAPI 3.0 specification", async () => {
      const res = await request(app).get("/api/docs/spec.json");
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe("3.0.3");
      expect(res.body.paths["/api/analyze"]).toBeDefined();
    });
  });

  describe("Authentication API (/api/auth)", () => {
    const testEmail = `test_runner_${Date.now()}@example.com`;
    const testPassword = "securePassword123";
    let authToken = null;

    it("POST /api/auth/register registers a new user and returns JWT token", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
          name: "DevOps Tester",
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      authToken = res.body.token;
    });

    it("POST /api/auth/register rejects duplicate registration with the same email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already exists");
    });

    it("POST /api/auth/login signs in successfully with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it("POST /api/auth/login rejects invalid password with 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: "wrongPassword",
        });

      expect(res.status).toBe(401);
    });

    it("GET /api/auth/me returns 401 when no token is provided", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("GET /api/auth/me returns 200 with user profile when valid Bearer token is provided", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testEmail);
    });
  });

  describe("Resume Analysis & Payload Validation (/api)", () => {
    it("POST /api/analyze returns 400 when resume file is missing", async () => {
      const res = await request(app)
        .post("/api/analyze")
        .field("jobDescription", "Senior Software Engineer needed for cloud backend");

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/resume/i);
    });

    it("POST /api/analyze returns 400 when job description is missing", async () => {
      const res = await request(app)
        .post("/api/analyze")
        .attach("resume", Buffer.from("Resume content", "utf-8"), "resume.txt");

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/job description/i);
    });

    it("POST /api/scrape-job returns 400 when url parameter is missing", async () => {
      const res = await request(app)
        .post("/api/scrape-job")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/url/i);
    });

    it("POST /api/rescore-live calculates instant real-time keyword rescoring", async () => {
      const res = await request(app)
        .post("/api/rescore-live")
        .send({
          resumeText: "Experience with React, Node.js, and Docker microservices in cloud environments.",
          jobDescription: "Requirements: React, Node.js, Docker, Kubernetes, AWS.",
          originalChecklist: [
            { skill: "Docker", status: "missing" },
            { skill: "Kubernetes", status: "missing" },
          ],
          baseScore: 70,
        });

      expect(res.status).toBe(200);
      expect(res.body.live_score).toBeDefined();
      expect(res.body.checklist).toBeDefined();
      expect(res.body.newly_resolved).toContain("Docker");
    });
  });

  describe("Cloud Database Sync API (/api/user)", () => {
    it("POST /api/user/sync-local successfully migrates local storage payload to SQLite", async () => {
      // First create a user token
      const reg = await request(app)
        .post("/api/auth/register")
        .send({
          email: `sync_user_${Date.now()}@example.com`,
          password: "password123",
          name: "Sync Tester",
        });

      const token = reg.body.token;

      const syncRes = await request(app)
        .post("/api/user/sync-local")
        .set("Authorization", `Bearer ${token}`)
        .send({
          history: [
            {
              fileName: "My_Resume.pdf",
              roleTitle: "Staff Engineer",
              score: 92,
              result: { matched_skills: ["Node.js", "Docker"] },
            },
          ],
          kanban: [
            {
              company: "Stripe",
              role: "Senior Full-Stack Engineer",
              stage: "interviewing",
              matchScore: 88,
            },
          ],
        });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.synced.historyCount).toBe(1);
      expect(syncRes.body.synced.kanbanCount).toBe(1);

      // Verify records are accessible via GET /api/user/kanban
      const kanbanRes = await request(app)
        .get("/api/user/kanban")
        .set("Authorization", `Bearer ${token}`);

      expect(kanbanRes.status).toBe(200);
      expect(kanbanRes.body.jobs.length).toBe(1);
      expect(kanbanRes.body.jobs[0].company).toBe("Stripe");
    });
  });
});

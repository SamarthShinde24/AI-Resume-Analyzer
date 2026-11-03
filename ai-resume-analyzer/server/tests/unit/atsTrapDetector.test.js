import { describe, it, expect } from "vitest";
import { detectAtsTraps } from "../../services/atsTrapDetector.js";

describe("ATS Trap & Parseability Detector Unit Tests (atsTrapDetector.js)", () => {
  it("flags missing standard section headers (Experience, Education, Skills)", () => {
    const poorResume = `
      John Doe
      john@example.com
      555-0199
      linkedin.com/in/johndoe

      Random Notes:
      I did some coding in Python and built a few small tools for fun.
    `;

    const report = detectAtsTraps(poorResume);
    const missingSections = report.traps.filter((t) => t.category === "ATS Section Trap");
    expect(missingSections.length).toBeGreaterThan(0);
    expect(report.ats_health_score).toBeLessThan(80);
  });

  it("detects excessive first-person pronouns ('I', 'my', 'we')", () => {
    const pronounHeavyResume = `
      John Doe
      john@example.com
      555-0199
      linkedin.com/in/johndoe

      EXPERIENCE
      I managed a team of developers. My role was to write code. I improved our performance and my code was tested by me. I led our standups.
      EDUCATION
      BS Computer Science
      SKILLS
      JavaScript, Python, React
    `;

    const report = detectAtsTraps(pronounHeavyResume);
    const pronounTrap = report.traps.find((t) => t.id === "pronoun_overuse");
    expect(pronounTrap).toBeDefined();
    expect(pronounTrap.severity).toBe("warning");
  });

  it("rewards fully compliant resumes with high parseability health score", () => {
    const compliantResume = `
      Sarah Connor
      sarah@example.com
      +1 (555) 234-5678
      linkedin.com/in/sarahconnor
      github.com/sarahconnor

      SUMMARY
      Senior Full-Stack Engineer with 8+ years architecting scalable cloud solutions, distributed backend microservices, and modern user experiences across global engineering organizations. Proven track record in high-concurrency systems, event-driven pipelines, and relational database tuning.

      EXPERIENCE
      Lead Backend Developer - Cyberdyne Systems (2021 - Present)
      • Engineered distributed payment processing pipeline in Node.js handling 250k daily events with 99.99% availability.
      • Reduced database query latency by 42% through Redis multi-layer caching and PostgreSQL B-tree indexing strategies.
      • Championed CI/CD automation with GitHub Actions and Docker containerization, cutting deployment cycle times by 65%.
      • Mentored 6 software engineers on asynchronous architecture, clean code standards, and comprehensive unit testing.

      Senior Software Engineer - TechCorp Solutions (2018 - 2021)
      • Spearheaded migration from monolithic application to Kubernetes microservices cluster on AWS cloud infrastructure.
      • Designed and deployed secure OAuth2 authentication flow protecting sensitive candidate data across 500k active users.
      • Collaborated with product managers, UX designers, and site reliability engineers to accelerate feature velocity.

      PROJECTS
      Cloud Infrastructure Orchestrator (github.com/sarahconnor/cloud-orch)
      • Open-source orchestration CLI built with TypeScript and Docker automating local development environments for 10k+ developers.

      EDUCATION
      BS Computer Engineering - Stanford University (2014 - 2018)

      SKILLS
      Node.js, TypeScript, React, Docker, Kubernetes, PostgreSQL, Redis, AWS, CI/CD, Microservices, Python, REST APIs
    `;

    const report = detectAtsTraps(compliantResume);
    expect(report.ats_health_score).toBeGreaterThanOrEqual(90);
    expect(report.total_traps_found).toBeLessThanOrEqual(1);
  });
});

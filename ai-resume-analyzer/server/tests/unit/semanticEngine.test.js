import { describe, it, expect } from "vitest";
import { computeSemanticSimilarity, tokenizeText } from "../../services/semanticEngine.js";

describe("Semantic Vector Engine Unit Tests (semanticEngine.js)", () => {
  it("tokenizes technical keywords and multi-word tech bigrams", () => {
    const text = "Architecting cloud systems with Docker, CI/CD pipelines, and React Native.";
    const tokens = tokenizeText(text);

    expect(tokens).toContain("docker");
    expect(tokens).toContain("ci cd");
    expect(tokens).toContain("react native");
  });

  it("yields high semantic match score when resume and JD share high keyword overlap", () => {
    const resume = "Experienced software engineer specializing in React, Node.js, TypeScript, PostgreSQL, and Docker microservices.";
    const jd = "Looking for a Software Engineer proficient in React, Node.js, TypeScript, Docker, and PostgreSQL databases.";

    const result = computeSemanticSimilarity(resume, jd);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.vector_overlap.length).toBeGreaterThan(0);
    expect(result.algorithm).toContain("TF-IDF");
  });

  it("yields low match score when resume and JD are in completely unrelated domains", () => {
    const resume = "Professional pastry chef with 10 years experience in sourdough baking, french croissants, and patisserie management.";
    const jd = "Senior Kubernetes Platform Engineer needed to manage AWS EKS clusters, Terraform modules, and Prometheus alerting.";

    const result = computeSemanticSimilarity(resume, jd);
    expect(result.score).toBeLessThan(40);
  });

  it("handles empty resume or empty job description safely with default score", () => {
    const result = computeSemanticSimilarity("", "Looking for React developer");
    expect(result.score).toBe(50);
    expect(result.vector_overlap).toEqual([]);
  });
});

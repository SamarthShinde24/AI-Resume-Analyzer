/**
 * Prompt generator for AI Behavioral & Technical Interview Question Generator (STAR Framework).
 */

export function buildInterviewPrompt(resumeText, jdText) {
  return `You are an elite Engineering Director and Hiring Manager at a tier-1 technology company.

Your task is to analyze the candidate's resume against the target job description and generate the TOP 5 targeted, high-probability interview questions a hiring manager or interview loop will ask for this specific role.

Formulate questions that probe:
1. The candidate's primary skill gaps or experience transitions relative to the JD.
2. Architecture, system design, or technical depth in the core technologies listed in the JD.
3. High-stakes behavioral scenarios (tradeoffs, project failures, conflict resolution, scale).

For every question, supply a masterfully crafted model answer strictly adhering to the STAR (Situation, Task, Action, Result) framework, grounded in the candidate's genuine background.

Return a SINGLE valid JSON object conforming EXACTLY to this schema (do NOT use markdown code fences, do not include any explanatory text outside the JSON):

{
  "role_title": "Target Role Title (e.g. Senior Backend Engineer)",
  "prep_strategy": "1-2 sentence executive briefing on the interview focus areas for this candidate.",
  "questions": [
    {
      "id": 1,
      "type": "technical", // "technical" or "behavioral"
      "target_competency": "Specific skill/area (e.g. Distributed Caching, CI/CD, Leadership)",
      "question": "The exact interview question phrasing",
      "why_asked": "Insight explaining why the hiring team asks this and what trap or signal they look for",
      "model_answer": {
        "situation": "Clear background context grounded in candidate's resume",
        "task": "The specific technical challenge, bottleneck, or business problem",
        "action": "Detailed technical and collaborative actions taken (first-person active voice)",
        "result": "Quantifiable business impact or performance outcome with metrics"
      },
      "interviewer_checklist": [
        "Key phrase or technical detail candidate must mention",
        "Expected depth or metric standard"
      ]
    }
  ]
}

Ensure you provide exactly 5 questions (mix of technical and behavioral).

TARGET JOB DESCRIPTION:
"""
${jdText}
"""

CANDIDATE RESUME:
"""
${resumeText}
"""`;
}

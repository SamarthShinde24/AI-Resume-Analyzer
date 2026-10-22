export function buildAnalyzePrompt(resumeText, jdText) {
  return `You are an expert technical recruiter, hiring manager, and ATS (Applicant Tracking System) specialist. Compare the RESUME below against the JOB DESCRIPTION and evaluate the match honestly and specifically — do not be generically positive.

RESUME:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jdText}
"""

Return ONLY valid JSON matching this exact schema:

{
  "match_score": <integer 0-100, overall weighted composite alignment>,
  "score_breakdown": {
    "skills_match": <integer 0-100, hard & functional technical skills match against the JD requirements>,
    "experience_fit": <integer 0-100, alignment with required years of experience, seniority level, and domain scope>,
    "quantifiable_impact": <integer 0-100, presence of measurable outcomes, metrics, %, numbers, and scale in bullet points>,
    "ats_readability": <integer 0-100, parseability, standard section headings, clean keyword density, clear flow>
  },
  "matched_skills": [<strings — specific skills/tools the resume clearly demonstrates that match the JD>],
  "missing_skills": [<strings — key skills/tools required or desired by the JD that are absent from the resume>],
  "weak_bullets": [
    {
      "original": "<verbatim bullet point from the resume>",
      "issue": "<concise explanation: lacks metrics, passive voice, unclear impact, irrelevant, etc.>",
      "rewrite": "<a powerful, quantified, JD-aligned rewrite demonstrating tangible business impact>"
    }
  ],
  "summary": "<2-3 sentence honest verdict on fit, strengths, and the single highest-leverage improvement to make>"
}

Scoring Guidelines:
- match_score: Objective rating. A resume missing critical requirements must score below 60.
- skills_match: Evaluate actual demonstrated competency, not just keyword mentions.
- experience_fit: Penalize overqualification or underqualification relative to role seniority.
- quantifiable_impact: Resumes that only list responsibilities (e.g. "Worked on APIs") rather than metrics (e.g. "Engineered 12 REST APIs reducing latency by 35%") must receive lower scores.
- ats_readability: Rate standard conventions, clarity, and keyword discoverability.
- Include 3 to 5 weak_bullets with the highest-impact potential for improvement.
- Rewrites must be realistic for the candidate's background without fabricating contradictory facts.`;
}

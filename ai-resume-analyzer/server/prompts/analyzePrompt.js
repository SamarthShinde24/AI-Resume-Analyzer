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
  "keyword_checklist": [
    {
      "skill": "<skill or tool name from JD>",
      "type": "<'required' for core job requirements, 'nice_to_have' for preferred qualifications>",
      "status": "<'missing' if absent or weak in resume, 'matched' if clearly evidenced>",
      "tip": "<actionable advice: where and how to integrate this keyword naturally into specific resume sections (e.g. 'Add to Skills section and mention in Project 1 architecture')>"
    }
  ],
  "weak_bullets": [
    {
      "original": "<verbatim bullet point from the resume>",
      "issue": "<concise explanation: lacks metrics, passive voice, unclear impact, irrelevant, etc.>",
      "rewrite": "<a powerful, quantified, JD-aligned rewrite demonstrating tangible business impact>"
    }
  ],
  "summary": "<2-3 sentence honest verdict on fit, strengths, and the single highest-leverage improvement to make>"
}

Scoring & Checklist Guidelines:
- match_score: Objective rating. A resume missing critical requirements must score below 60.
- keyword_checklist: Include 6-12 high-priority keywords from the JD. Distinguish between 'required' (must-haves) and 'nice_to_have' (bonus qualifications).
- Provide concrete placement tips for missing keywords (e.g. which bullet or section to enrich).
- Include 3 to 5 weak_bullets with the highest-impact potential for improvement.
- Rewrites must be realistic for the candidate's background without fabricating contradictory facts.`;
}

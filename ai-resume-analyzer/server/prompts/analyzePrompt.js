export function buildAnalyzePrompt(resumeText, jdText) {
  return `You are an expert technical recruiter and resume coach. Compare the RESUME below against the JOB DESCRIPTION and evaluate the match honestly and specifically — do not be generically positive.

RESUME:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jdText}
"""

Return ONLY valid JSON, with no markdown fences, no preamble, and no trailing text. Match this exact shape:

{
  "match_score": <integer 0-100>,
  "matched_skills": [<strings — skills/requirements the resume clearly demonstrates>],
  "missing_skills": [<strings — requirements from the JD not evidenced in the resume>],
  "weak_bullets": [
    {
      "original": "<verbatim bullet from the resume>",
      "issue": "<what's weak about it — vague, no metrics, buzzwordy, irrelevant, etc.>",
      "rewrite": "<a stronger, quantified, JD-aligned rewrite>"
    }
  ],
  "summary": "<2-3 sentence honest verdict on fit and the single biggest thing to fix>"
}

Rules:
- match_score should reflect real alignment, not encouragement. A resume with major gaps should score low.
- Include at most 5 weak_bullets — pick the ones with the highest-impact fixes.
- Every rewrite should be something the candidate could plausibly claim (do not invent achievements/metrics that contradict the original).
- Output must be valid JSON parseable by JSON.parse(). Nothing else.`;
}

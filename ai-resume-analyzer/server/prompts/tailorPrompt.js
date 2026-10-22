export function buildTailorPrompt(resumeText, jdText) {
  return `You are an elite executive resume writer and ATS optimization specialist. 
Your task is to take the candidate's verified RESUME and the target JOB DESCRIPTION, and generate high-converting, tailored resume content.

CANDIDATE RESUME:
"""
${resumeText}
"""

TARGET JOB DESCRIPTION:
"""
${jdText}
"""

CRITICAL INSTRUCTIONS:
- Ground every achievement in the candidate's actual experience. Do NOT hallucinate entirely fabricated companies, degrees, or unperformed roles.
- Emphasize transferable achievements, relevant keywords, and quantify impact (latency, throughput, revenue, cost savings, team size, efficiency %).
- Use active voice, strong power verbs (Engineered, Architected, Spearheaded, Accelerated, Delivered).

Return ONLY valid JSON matching this exact schema:

{
  "ats_headline": "<a compelling target title and core specialization tagline, e.g. 'Senior Full-Stack Engineer | Distributed Systems, Cloud Architecture & React'>",
  "tailored_summary": "<a punchy, 3-4 sentence executive summary positioning the candidate as the ideal candidate for THIS specific role>",
  "core_competencies": [<6-10 prioritized keywords/skills from the JD that the candidate legitimately possesses>],
  "tailored_bullets": [
    {
      "context": "<which company, role, or project this bullet relates to>",
      "original_focus": "<what the candidate originally highlighted>",
      "tailored_bullet": "<a high-impact, quantified, JD-aligned bullet starting with a strong action verb>"
    }
  ],
  "tailoring_strategy": "<1-2 sentences explaining why this positioning maximizes ATS ranking and hiring manager interest for this specific JD>"
}`;
}

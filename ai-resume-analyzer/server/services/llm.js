import { buildAnalyzePrompt } from "../prompts/analyzePrompt.js";
import { buildTailorPrompt } from "../prompts/tailorPrompt.js";
import { buildInterviewPrompt } from "../prompts/interviewPrompt.js";
import { buildCoverLetterPrompt } from "../prompts/coverLetterPrompt.js";

const SYSTEM_INSTRUCTION =
  "You are an expert ATS (Applicant Tracking System) and senior technical recruiter. You evaluate resumes with rigorous objectivity. You must output strictly valid JSON conforming to the requested schema. Never wrap response in markdown code blocks or add conversational preamble.";

/**
 * Strips markdown code blocks and isolates valid JSON substring.
 */
export function cleanJsonResponse(text) {
  if (!text) return "";
  let cleaned = text.trim();

  // Strip think blocks if any
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Strip markdown fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  // If stray preamble/postscript exists, isolate JSON object bounds
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

/**
 * Resolves which provider and API key to use based on environment configuration.
 */
export function resolveProviderConfig() {
  const explicitProvider = process.env.LLM_PROVIDER?.toLowerCase().trim();

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  let provider = explicitProvider;

  if (!provider) {
    if (groqKey) provider = "groq";
    else if (anthropicKey) provider = "anthropic";
    else if (openaiKey) provider = "openai";
    else {
      throw new Error(
        "No LLM API key detected. Please configure GROQ_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY in server/.env."
      );
    }
  }

  switch (provider) {
    case "groq": {
      if (!groqKey) {
        throw new Error("GROQ_API_KEY is not set in server/.env.");
      }
      return {
        provider: "groq",
        apiKey: groqKey,
        model: process.env.GROQ_MODEL || process.env.LLM_MODEL || "openai/gpt-oss-120b",
      };
    }
    case "anthropic": {
      if (!anthropicKey) {
        throw new Error("ANTHROPIC_API_KEY is not set in server/.env.");
      }
      return {
        provider: "anthropic",
        apiKey: anthropicKey,
        model: process.env.ANTHROPIC_MODEL || process.env.LLM_MODEL || "claude-3-5-sonnet-20241022",
      };
    }
    case "openai": {
      if (!openaiKey) {
        throw new Error("OPENAI_API_KEY is not set in server/.env.");
      }
      return {
        provider: "openai",
        apiKey: openaiKey,
        model: process.env.OPENAI_MODEL || process.env.LLM_MODEL || "gpt-4o-mini",
      };
    }
    default:
      throw new Error(
        `Unsupported LLM provider "${provider}". Supported providers: "groq", "anthropic", "openai".`
      );
  }
}

/**
 * Dispatches a completion request using native structured JSON mode where supported.
 */
export async function callStructuredLLM(prompt, systemInstruction = SYSTEM_INSTRUCTION) {
  const config = resolveProviderConfig();
  const { provider, apiKey, model } = config;

  if (provider === "groq" || provider === "openai") {
    const endpoint =
      provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    const candidateModels =
      provider === "groq"
        ? [model, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"].filter(
            (m, i, arr) => m && arr.indexOf(m) === i
          )
        : [model];

    let lastError = null;
    for (const curModel of candidateModels) {
      const payload = {
        model: curModel,
        messages: [
          { role: "system", content: `${systemInstruction} Output valid JSON.` },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      };

      let res;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        // Fallback if model doesn't support response_format: { type: "json_object" }
        if (!res.ok && res.status === 400) {
          delete payload.response_format;
          res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
          });
        }

        if (!res.ok) {
          const errBody = await res.text();
          lastError = new Error(`${provider.toUpperCase()} API error (${res.status}): ${errBody}`);
          if (
            provider === "groq" &&
            (res.status === 404 ||
              errBody.includes("model_not_found") ||
              errBody.includes("decommissioned"))
          ) {
            console.warn(`Model "${curModel}" unavailable on Groq. Trying fallback...`);
            continue;
          }
          throw lastError;
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
      } catch (err) {
        lastError = err;
        if (
          provider === "groq" &&
          (err.message.includes("model_not_found") || err.message.includes("decommissioned") || err.message.includes("404"))
        ) {
          continue;
        }
        throw err;
      }
    }

    if (lastError) throw lastError;
  }

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.2,
        system: `${systemInstruction} Output valid JSON only.`,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || "";
  }

  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * Sanitizes and validates the parsed JSON response from the LLM.
 */
function normalizeAnalysisResult(parsed) {
  const rawScore = Number(parsed.match_score);
  const match_score = Number.isFinite(rawScore)
    ? Math.max(0, Math.min(100, Math.round(rawScore)))
    : 50;

  const matched_skills = Array.isArray(parsed.matched_skills)
    ? parsed.matched_skills.map(String)
    : [];

  const missing_skills = Array.isArray(parsed.missing_skills)
    ? parsed.missing_skills.map(String)
    : [];

  const weak_bullets = Array.isArray(parsed.weak_bullets)
    ? parsed.weak_bullets.map((b) => ({
        original: String(b?.original || ""),
        issue: String(b?.issue || ""),
        rewrite: String(b?.rewrite || ""),
      }))
    : [];

  const summary = String(parsed.summary || "No summary provided.");

  const rawBreakdown = parsed.score_breakdown || {};
  const normalizeSubScore = (val, fallback) => {
    const n = Number(val);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : fallback;
  };

  const score_breakdown = {
    skills_match: normalizeSubScore(rawBreakdown.skills_match, match_score),
    experience_fit: normalizeSubScore(rawBreakdown.experience_fit, match_score),
    quantifiable_impact: normalizeSubScore(rawBreakdown.quantifiable_impact, Math.max(30, match_score - 10)),
    ats_readability: normalizeSubScore(rawBreakdown.ats_readability, 85),
  };

  const rawChecklist = Array.isArray(parsed.keyword_checklist) ? parsed.keyword_checklist : [];
  const keyword_checklist = rawChecklist
    .map((item) => ({
      skill: String(item?.skill || "").trim(),
      type: item?.type === "nice_to_have" ? "nice_to_have" : "required",
      status: item?.status === "matched" ? "matched" : "missing",
      tip: String(item?.tip || "Integrate this keyword into your relevant project or experience bullets.").trim(),
    }))
    .filter((k) => k.skill.length > 0);

  // Fallback: If model only supplied missing_skills, populate keyword_checklist automatically
  if (keyword_checklist.length === 0) {
    missing_skills.forEach((skill) => {
      keyword_checklist.push({
        skill,
        type: "required",
        status: "missing",
        tip: `Add ${skill} to your technical skills summary or describe hands-on usage in a project.`,
      });
    });
    matched_skills.forEach((skill) => {
      keyword_checklist.push({
        skill,
        type: "required",
        status: "matched",
        tip: `Demonstrated match. Keep prominent in your technical highlights.`,
      });
    });
  }

  return {
    match_score,
    score_breakdown,
    matched_skills,
    missing_skills,
    keyword_checklist,
    weak_bullets,
    summary,
  };
}

/**
 * Analyzes resume against job description using the configured LLM provider.
 * Automatically retries once with a stricter instruction if JSON parsing fails.
 */
export async function analyzeResume(resumeText, jdText) {
  const basePrompt = buildAnalyzePrompt(resumeText, jdText);

  const attempt = async (extraInstruction = "") => {
    const rawText = await callStructuredLLM(basePrompt + extraInstruction);
    const cleaned = cleanJsonResponse(rawText);
    const parsed = JSON.parse(cleaned);
    return normalizeAnalysisResult(parsed);
  };

  try {
    return await attempt();
  } catch (initialError) {
    console.warn("First LLM parse attempt failed, retrying with strict JSON instruction:", initialError.message);
    try {
      return await attempt(
        "\n\nCRITICAL: Respond with ONLY a single raw JSON object matching the requested schema. No markdown fences, no explanatory text."
      );
    } catch (retryError) {
      throw new Error(`Failed to get valid JSON from LLM provider after retry: ${retryError.message}`);
    }
  }
}

/**
 * Generates targeted tailored resume content (summary, headline, keywords, tailored bullets)
 * aligned with the target job description.
 */
export async function tailorResume(resumeText, jdText) {
  const basePrompt = buildTailorPrompt(resumeText, jdText);

  const attempt = async (extraInstruction = "") => {
    const rawText = await callStructuredLLM(
      basePrompt + extraInstruction,
      "You are an expert executive resume writer. Output strictly valid JSON."
    );
    const cleaned = cleanJsonResponse(rawText);
    const parsed = JSON.parse(cleaned);

    return {
      ats_headline: String(parsed.ats_headline || "Experienced Technical Professional"),
      tailored_summary: String(parsed.tailored_summary || ""),
      core_competencies: Array.isArray(parsed.core_competencies)
        ? parsed.core_competencies.map(String)
        : [],
      tailored_bullets: Array.isArray(parsed.tailored_bullets)
        ? parsed.tailored_bullets.map((b) => ({
            context: String(b?.context || "Experience"),
            original_focus: String(b?.original_focus || ""),
            tailored_bullet: String(b?.tailored_bullet || ""),
          }))
        : [],
      tailoring_strategy: String(parsed.tailoring_strategy || ""),
    };
  };

  try {
    return await attempt();
  } catch (initialError) {
    console.warn("Tailor attempt failed, retrying:", initialError.message);
    try {
      return await attempt(
        "\n\nCRITICAL: Respond with ONLY a single raw JSON object matching the requested schema. No markdown fences, no explanatory text."
      );
    } catch (retryError) {
      throw new Error(`Failed to generate tailored resume content: ${retryError.message}`);
    }
  }
}

/**
 * Generates Top 5 targeted technical & behavioral interview questions with STAR answers.
 */
export async function generateInterviewQuestions(resumeText, jdText) {
  const basePrompt = buildInterviewPrompt(resumeText, jdText);

  const attempt = async (extraInstruction = "") => {
    const rawText = await callStructuredLLM(
      basePrompt + extraInstruction,
      "You are an expert technical interviewer and hiring manager. Output strictly valid JSON."
    );
    const cleaned = cleanJsonResponse(rawText);
    const parsed = JSON.parse(cleaned);

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.map((q, idx) => ({
          id: q?.id ?? idx + 1,
          type: q?.type === "behavioral" ? "behavioral" : "technical",
          target_competency: String(q?.target_competency || "Core Competency"),
          question: String(q?.question || "Targeted Interview Question"),
          why_asked: String(q?.why_asked || "Evaluates candidate suitability and problem-solving approach."),
          model_answer: {
            situation: String(q?.model_answer?.situation || ""),
            task: String(q?.model_answer?.task || ""),
            action: String(q?.model_answer?.action || ""),
            result: String(q?.model_answer?.result || ""),
          },
          interviewer_checklist: Array.isArray(q?.interviewer_checklist)
            ? q.interviewer_checklist.map(String)
            : [],
        }))
      : [];

    return {
      role_title: String(parsed.role_title || "Target Role"),
      prep_strategy: String(parsed.prep_strategy || "Focus on concrete architecture tradeoffs and STAR-formatted metrics."),
      questions,
    };
  };

  try {
    return await attempt();
  } catch (initialError) {
    console.warn("Interview prep attempt failed, retrying:", initialError.message);
    try {
      return await attempt(
        "\n\nCRITICAL: Respond with ONLY a single raw JSON object matching the requested schema. No markdown fences, no explanatory text."
      );
    } catch (retryError) {
      throw new Error(`Failed to generate interview prep questions: ${retryError.message}`);
    }
  }
}

/**
 * Generates a targeted, high-converting 3-paragraph cover letter tailored to the job description.
 */
export async function generateCoverLetter(resumeText, jdText) {
  const basePrompt = buildCoverLetterPrompt(resumeText, jdText);

  const attempt = async (extraInstruction = "") => {
    const rawText = await callStructuredLLM(
      basePrompt + extraInstruction,
      "You are an executive cover letter writer and technical recruiter. Output strictly valid JSON."
    );
    const cleaned = cleanJsonResponse(rawText);
    const parsed = JSON.parse(cleaned);

    const fullLetter = parsed.full_letter
      ? String(parsed.full_letter).trim()
      : [
          parsed.salutation || "Dear Hiring Team,",
          "",
          parsed.paragraph_hook || "",
          "",
          parsed.paragraph_body || "",
          "",
          parsed.paragraph_close || "",
          "",
          parsed.sign_off || "Sincerely,\nCandidate",
        ]
          .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
          .join("\n");

    return {
      candidate_name: String(parsed.candidate_name || "Applicant"),
      target_role: String(parsed.target_role || "Target Role"),
      company_name: String(parsed.company_name || "Hiring Team"),
      subject_line: String(parsed.subject_line || "Job Application"),
      salutation: String(parsed.salutation || "Dear Hiring Team,"),
      paragraph_hook: String(parsed.paragraph_hook || ""),
      paragraph_body: String(parsed.paragraph_body || ""),
      paragraph_close: String(parsed.paragraph_close || ""),
      sign_off: String(parsed.sign_off || "Sincerely,\nCandidate"),
      full_letter: fullLetter,
      highlight_bullets: Array.isArray(parsed.highlight_bullets)
        ? parsed.highlight_bullets.map(String)
        : [],
      tone_strategy: String(parsed.tone_strategy || "High-converting, metric-driven positioning."),
    };
  };

  try {
    return await attempt();
  } catch (initialError) {
    console.warn("Cover letter attempt failed, retrying:", initialError.message);
    try {
      return await attempt(
        "\n\nCRITICAL: Respond with ONLY a single raw JSON object matching the requested schema. No markdown fences, no explanatory text."
      );
    } catch (retryError) {
      throw new Error(`Failed to generate tailored cover letter: ${retryError.message}`);
    }
  }
}


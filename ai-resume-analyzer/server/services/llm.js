import { buildAnalyzePrompt } from "../prompts/analyzePrompt.js";

const SYSTEM_INSTRUCTION =
  "You are an expert ATS (Applicant Tracking System) and senior technical recruiter. You evaluate resumes with rigorous objectivity. You must output strictly valid JSON conforming to the requested schema. Never wrap response in markdown code blocks or add conversational preamble.";

/**
 * Strips markdown code blocks and isolates valid JSON substring.
 */
export function cleanJsonResponse(text) {
  if (!text) return "";
  let cleaned = text.trim();

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
        model: process.env.GROQ_MODEL || process.env.LLM_MODEL || "llama-3.3-70b-versatile",
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

    const payload = {
      model,
      messages: [
        { role: "system", content: `${systemInstruction} Output valid JSON.` },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    };

    let res = await fetch(endpoint, {
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
      throw new Error(`${provider.toUpperCase()} API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
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

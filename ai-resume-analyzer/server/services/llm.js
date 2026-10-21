import { buildAnalyzePrompt } from "../prompts/analyzePrompt.js";

/**
 * Strips markdown code blocks and returns clean JSON string.
 */
function cleanJsonResponse(text) {
  if (!text) return "";
  return text
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/m, "")
    .trim();
}

/**
 * Resolves which provider and API key to use based on environment configuration.
 */
function resolveProviderConfig() {
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
 * Dispatches a completion request to the configured LLM provider.
 */
async function callLLM(config, prompt) {
  const { provider, apiKey, model } = config;

  if (provider === "groq" || provider === "openai") {
    const endpoint =
      provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

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

  return {
    match_score,
    matched_skills,
    missing_skills,
    weak_bullets,
    summary,
  };
}

/**
 * Analyzes resume against job description using the configured LLM provider.
 * Automatically retries once with a stricter instruction if JSON parsing fails.
 */
export async function analyzeResume(resumeText, jdText) {
  const config = resolveProviderConfig();
  const basePrompt = buildAnalyzePrompt(resumeText, jdText);

  const attempt = async (extraInstruction = "") => {
    const rawText = await callLLM(config, basePrompt + extraInstruction);
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
      throw new Error(`Failed to get valid JSON from ${config.provider} after retry: ${retryError.message}`);
    }
  }
}

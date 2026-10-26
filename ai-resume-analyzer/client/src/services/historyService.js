const STORAGE_KEY = "ai_resume_analyzer_history_v1";
const MAX_HISTORY_ITEMS = 25;

/**
 * Extracts a role title from a job description string (e.g. "Senior Full-Stack Engineer").
 */
export function extractRoleTitle(jdText) {
  if (!jdText) return "Software Engineering Role";
  const lines = jdText.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    const match = line.match(/(?:job title|role|position|title)\s*:\s*(.+)/i);
    if (match && match[1]) {
      return match[1].replace(/["']/g, "").slice(0, 45);
    }
  }
  return lines[0]?.slice(0, 45) || "Target Position";
}

/**
 * Retrieves all stored analysis versions from localStorage.
 * Returns array ordered newest to oldest.
 */
export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load history from localStorage:", err);
    return [];
  }
}

/**
 * Saves a new analysis snapshot to localStorage.
 * Auto-increments version number and calculates delta relative to prior iteration.
 */
export function saveAnalysis(result, meta = {}) {
  try {
    const history = getHistory();
    const nextVersionNum = history.length > 0 ? Math.max(...history.map((h) => h.version || 1)) + 1 : 1;

    const previousItem = history[0] || null;
    const score = Number(result.match_score) || 0;
    const previousScore = previousItem ? Number(previousItem.score) || 0 : null;
    const delta = previousScore !== null ? score - previousScore : 0;

    const roleTitle = meta.roleTitle || extractRoleTitle(meta.jobDescription);
    const fileName = meta.fileName || "Resume Document";

    const newSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      version: nextVersionNum,
      versionLabel: `v${nextVersionNum}`,
      timestamp: new Date().toISOString(),
      formattedDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      fileName,
      roleTitle,
      score,
      delta,
      score_breakdown: result.score_breakdown || {
        skills_match: score,
        experience_fit: score,
        quantifiable_impact: Math.max(30, score - 10),
        ats_readability: 85,
      },
      matchedCount: result.matched_skills?.length || 0,
      missingCount: result.missing_skills?.length || 0,
      weakBulletsCount: result.weak_bullets?.length || 0,
      jobDescription: meta.jobDescription || "",
      result, // Complete result payload for snapshot restoration
    };

    const updated = [newSnapshot, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newSnapshot;
  } catch (err) {
    console.error("Failed to save analysis snapshot to localStorage:", err);
    return null;
  }
}

/**
 * Removes a single version from history by ID.
 */
export function deleteVersion(id) {
  try {
    const history = getHistory();
    const updated = history.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to delete history item:", err);
    return getHistory();
  }
}

/**
 * Clears all analysis history.
 */
export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (err) {
    console.error("Failed to clear history:", err);
    return [];
  }
}

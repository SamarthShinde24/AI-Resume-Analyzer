/**
 * Computes deep progression differences between two resume analysis snapshots.
 *
 * @param {Object} vOld - The older version snapshot
 * @param {Object} vNew - The newer version snapshot
 * @returns {Object} Structured comparison diff
 */
export function computeVersionDiff(vOld, vNew) {
  if (!vOld || !vNew) return null;

  const scoreOld = Number(vOld.score) || 0;
  const scoreNew = Number(vNew.score) || 0;
  const overallDelta = scoreNew - scoreOld;

  const breakdownOld = vOld.score_breakdown || {};
  const breakdownNew = vNew.score_breakdown || {};

  const dimensionsDelta = {
    skills_match: {
      old: breakdownOld.skills_match ?? scoreOld,
      new: breakdownNew.skills_match ?? scoreNew,
      delta: (breakdownNew.skills_match ?? scoreNew) - (breakdownOld.skills_match ?? scoreOld),
    },
    experience_fit: {
      old: breakdownOld.experience_fit ?? scoreOld,
      new: breakdownNew.experience_fit ?? scoreNew,
      delta: (breakdownNew.experience_fit ?? scoreNew) - (breakdownOld.experience_fit ?? scoreOld),
    },
    quantifiable_impact: {
      old: breakdownOld.quantifiable_impact ?? Math.max(30, scoreOld - 10),
      new: breakdownNew.quantifiable_impact ?? Math.max(30, scoreNew - 10),
      delta:
        (breakdownNew.quantifiable_impact ?? Math.max(30, scoreNew - 10)) -
        (breakdownOld.quantifiable_impact ?? Math.max(30, scoreOld - 10)),
    },
    ats_readability: {
      old: breakdownOld.ats_readability ?? 85,
      new: breakdownNew.ats_readability ?? 85,
      delta: (breakdownNew.ats_readability ?? 85) - (breakdownOld.ats_readability ?? 85),
    },
  };

  const oldMissing = new Set(vOld.result?.missing_skills || []);
  const newMatched = new Set(vNew.result?.matched_skills || []);

  // Keywords that were missing in vOld but are now matched in vNew
  const resolvedKeywords = [...oldMissing].filter((skill) => newMatched.has(skill));

  // Keywords still missing in vNew
  const remainingMissing = vNew.result?.missing_skills || [];

  // Progression verdict summary
  let progressHeadline = "";
  if (overallDelta > 15) {
    progressHeadline = `Outstanding progress! Your revisions improved alignment by +${overallDelta} points.`;
  } else if (overallDelta > 0) {
    progressHeadline = `Positive iteration (+${overallDelta} points). Key gaps were successfully addressed.`;
  } else if (overallDelta === 0) {
    progressHeadline = "Scores remained identical between these two versions.";
  } else {
    progressHeadline = `Score declined by ${Math.abs(overallDelta)} points. Check if critical experience was removed.`;
  }

  return {
    versionOld: vOld.versionLabel || `v${vOld.version}`,
    versionNew: vNew.versionLabel || `v${vNew.version}`,
    scoreOld,
    scoreNew,
    overallDelta,
    isGain: overallDelta > 0,
    dimensionsDelta,
    resolvedKeywords,
    remainingMissing,
    weakBulletsOldCount: vOld.result?.weak_bullets?.length || 0,
    weakBulletsNewCount: vNew.result?.weak_bullets?.length || 0,
    progressHeadline,
  };
}

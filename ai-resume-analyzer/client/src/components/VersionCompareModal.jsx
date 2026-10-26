import { useMemo } from "react";
import { computeVersionDiff } from "../utils/versionDiff.js";

export default function VersionCompareModal({ isOpen, onClose, vOld, vNew, onRestoreVersion }) {
  const diff = useMemo(() => {
    if (!vOld || !vNew) return null;
    return computeVersionDiff(vOld, vNew);
  }, [vOld, vNew]);

  if (!isOpen || !diff) return null;

  const dimensionLabels = {
    skills_match: "Hard Skills Alignment",
    experience_fit: "Experience & Seniority",
    quantifiable_impact: "Quantifiable Impact",
    ats_readability: "ATS Readability",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in print:hidden">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Iteration Comparison
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              Resume Progression ({diff.versionOld} vs {diff.versionNew})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating score improvement and resolved keyword gaps across revisions
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Main Progression Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {diff.versionOld} Baseline
                  </span>
                  <div className="text-3xl font-black">{diff.scoreOld}%</div>
                </div>

                <div className="text-xl font-bold text-indigo-400">→</div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    {diff.versionNew} Revision
                  </span>
                  <div className="text-3xl font-black text-emerald-400">{diff.scoreNew}%</div>
                </div>
              </div>

              <div
                className={`px-4 py-2 rounded-xl text-center font-black text-sm border ${
                  diff.isGain
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : diff.overallDelta < 0
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {diff.isGain
                  ? `+${diff.overallDelta}% Gain`
                  : diff.overallDelta === 0
                  ? "No Change"
                  : `${diff.overallDelta}% Change`}
              </div>
            </div>

            <p className="text-xs text-indigo-200 mt-4 leading-relaxed font-medium pt-3 border-t border-indigo-900/60">
              💡 {diff.progressHeadline}
            </p>
          </div>

          {/* Dimension Comparison Bars */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dimension-by-Dimension Delta
            </h4>

            <div className="space-y-2.5">
              {Object.entries(diff.dimensionsDelta).map(([key, item]) => {
                const isItemGain = item.delta > 0;
                const isItemLoss = item.delta < 0;

                return (
                  <div key={key} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">{dimensionLabels[key]}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400">{item.old}%</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-bold text-slate-900">{item.new}%</span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                            isItemGain
                              ? "bg-emerald-100 text-emerald-700"
                              : isItemLoss
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isItemGain ? `+${item.delta}%` : `${item.delta}%`}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          item.new >= 75
                            ? "bg-emerald-500"
                            : item.new >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, item.new))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolved Keywords Highlights */}
          {diff.resolvedKeywords.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Keywords Resolved in this Iteration ({diff.resolvedKeywords.length})
                </h4>
              </div>
              <p className="text-[11px] text-emerald-800">
                These previously missing requirements were successfully integrated into {diff.versionNew}:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {diff.resolvedKeywords.map((k, i) => (
                  <span
                    key={i}
                    className="text-xs font-bold bg-white text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-lg shadow-2xs"
                  >
                    + {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Remaining Gaps */}
          {diff.remainingMissing.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Still Missing in {diff.versionNew} ({diff.remainingMissing.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {diff.remainingMissing.map((k, i) => (
                  <span
                    key={i}
                    className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-medium"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Close Comparison
          </button>

          {onRestoreVersion && (
            <button
              type="button"
              onClick={() => {
                onRestoreVersion(vNew);
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs cursor-pointer"
            >
              Load {diff.versionNew} Snapshot
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

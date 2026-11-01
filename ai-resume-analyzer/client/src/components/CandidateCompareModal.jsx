export default function CandidateCompareModal({
  isOpen,
  onClose,
  candidates = [],
  onToast,
}) {
  if (!isOpen || candidates.length === 0) return null;

  const handleCopyComparison = async () => {
    const text = candidates
      .map(
        (c) =>
          `Candidate: ${c.candidate_name} (Rank #${c.rank})\n` +
          `• Overall Match: ${c.score}%\n` +
          `• Semantic Overlap: ${c.semantic_score}%\n` +
          `• ATS Parseability Health: ${c.ats_health_score}%\n` +
          `• Top Matched Skills: ${(c.matched_keywords || []).map((k) => k.term).join(", ") || "General Stack"}\n`
      )
      .join("\n---\n\n");

    try {
      await navigator.clipboard.writeText(text);
      if (onToast) onToast("Copied comparative candidate matrix to clipboard!");
    } catch {
      if (onToast) onToast("Comparison matrix generated!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
              <span>📊 Recruiter Decision Matrix</span>
              <span className="text-indigo-300">•</span>
              <span>Side-by-Side</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Candidate Comparison Matrix ({candidates.length} Profiles)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyComparison}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1 cursor-pointer"
            >
              <span>📋 Copy Matrix</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className={`grid grid-cols-1 ${candidates.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-4`}>
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        Rank #{cand.rank}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">
                        {cand.candidate_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                        {cand.file_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        {cand.score}%
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cand.status_badge}`}>
                        {cand.status}
                      </span>
                    </div>
                  </div>

                  {/* Quantitative Scores */}
                  <div className="space-y-2 mt-4 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Semantic Cosine Overlap:</span>
                      <span className="font-bold font-mono text-slate-800">{cand.semantic_score}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">ATS Formatting Health:</span>
                      <span className="font-bold font-mono text-slate-800">{cand.ats_health_score}%</span>
                    </div>
                  </div>

                  {/* Top Matched Keywords */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Top Matched Skills
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cand.matched_keywords && cand.matched_keywords.length > 0 ? (
                        cand.matched_keywords.slice(0, 6).map((k, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md"
                          >
                            ✓ {k.term} ({k.count}x)
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">None detected</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onToast) onToast(`Shortlisted ${cand.candidate_name} for interview loop!`);
                  }}
                  className="w-full mt-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>⭐ Shortlist Candidate</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Comparative evaluation based on semantic embedding cosine & ATS compliance.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}

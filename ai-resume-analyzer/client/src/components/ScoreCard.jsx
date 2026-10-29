export default function ScoreCard({
  score,
  summary,
  breakdown,
  hybridScore,
  semanticAnalysis,
  onOpenEditor,
  onSaveToKanban,
}) {
  const getScoreColor = (val) => {
    if (val >= 75) return "text-emerald-600";
    if (val >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  const getStrokeColor = (val) => {
    if (val >= 75) return "#10b981"; // emerald-500
    if (val >= 50) return "#f59e0b"; // amber-500
    return "#f43f5e"; // rose-500
  };

  const getVerdictLabel = (val) => {
    if (val >= 85) return "Excellent Match (Top 10% Candidate)";
    if (val >= 70) return "Strong Candidate (Ready for Interview)";
    if (val >= 50) return "Moderate Fit (Requires Tailoring)";
    return "High Risk (Significant Requirement Gaps)";
  };

  const getVerdictBadge = (val) => {
    if (val >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (val >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  // SVG Radial Gauge geometry calculations
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ~326.73
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const dimensions = [
    {
      key: "skills_match",
      label: "Skills Match",
      description: "Hard requirements & technical stack",
      value: breakdown?.skills_match ?? score,
    },
    {
      key: "experience_fit",
      label: "Experience & Seniority",
      description: "Years of experience & role scope",
      value: breakdown?.experience_fit ?? score,
    },
    {
      key: "quantifiable_impact",
      label: "Quantifiable Impact",
      description: "Measurable metrics & achievements",
      value: breakdown?.quantifiable_impact ?? Math.max(30, score - 10),
    },
    {
      key: "ats_readability",
      label: "ATS Formatting",
      description: "Structure, parsing & keyword flow",
      value: breakdown?.ats_readability ?? 85,
    },
  ];

  const getBarColor = (val) => {
    if (val >= 75) return "bg-emerald-500";
    if (val >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header with SVG Radial Score Gauge & Verdict */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="text-center sm:text-left space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            ATS Compatibility Rating
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Overall Candidate Match
          </h2>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getVerdictBadge(
                score
              )}`}
            >
              {getVerdictLabel(score)}
            </span>
            {onOpenEditor && (
              <button
                type="button"
                onClick={onOpenEditor}
                className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>✏️ Live Editor</span>
              </button>
            )}
            {onSaveToKanban && (
              <button
                type="button"
                onClick={onSaveToKanban}
                className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>💼 Track in Pipeline</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 pt-1">
            Calculated across skills alignment, experience depth, metrics impact, and parseability.
          </p>
        </div>

        {/* Radial SVG Circular Score Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
            {/* Background Track */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="9"
              fill="transparent"
              className="text-slate-100"
            />
            {/* Animated Progress Arc */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={getStrokeColor(score)}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Centered Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black tracking-tight ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">
              out of 100
            </span>
          </div>
        </div>
      </div>

      {/* Hybrid AI Intelligence Pill Banner */}
      {semanticAnalysis && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-900">
                Hybrid AI Scoring Engine
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Deterministic + Generative
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                LLM Score: <strong className="text-slate-800">{score}%</strong> (65%)
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">
                Vector Cosine: <strong className="text-indigo-600">{semanticAnalysis.score}%</strong> (35%)
              </span>
              {hybridScore && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-800 font-extrabold bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    Blended: {hybridScore}%
                  </span>
                </>
              )}
            </div>
          </div>

          {semanticAnalysis.vector_overlap?.length > 0 && (
            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                <span className="font-semibold text-slate-600">Top Semantic Vector Overlap:</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {semanticAnalysis.algorithm || "TF-IDF N-Gram Cosine"} (Cosine: {semanticAnalysis.raw_cosine || "0.64"})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {semanticAnalysis.vector_overlap.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                  >
                    <span>{item.term}</span>
                    <span className="text-[9px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1 rounded">
                      {item.weight}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Dimensional Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Multi-Dimensional Dimension Scores
          </h3>
          <span className="text-[11px] text-slate-400">100% Scale</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map((dim) => (
            <div
              key={dim.key}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2 hover:border-slate-200 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{dim.label}</span>
                <span className="text-xs font-extrabold text-slate-900 font-mono">
                  {dim.value}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">{dim.description}</p>
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ease-out ${getBarColor(
                    dim.value
                  )}`}
                  style={{ width: `${Math.min(100, Math.max(5, dim.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recruiter Executive Summary */}
      {summary && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-indigo-600 font-bold text-xs">💬</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              Recruiter's Executive Verdict
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed font-normal">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ScoreCard({ score, summary, breakdown }) {
  const getScoreColor = (val) => {
    if (val >= 75) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (val >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getBarColor = (val) => {
    if (val >= 75) return "bg-emerald-500";
    if (val >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getVerdictLabel = (val) => {
    if (val >= 85) return "Excellent Match";
    if (val >= 70) return "Strong Candidate";
    if (val >= 50) return "Moderate Fit (Requires Tailoring)";
    return "High Risk / Low Match";
  };

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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header with Overall Score & Verdict */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            ATS Evaluation
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">Overall Alignment Score</h2>
          <p className="text-sm text-gray-500 mt-1">
            Status:{" "}
            <span className="font-medium text-gray-800">{getVerdictLabel(score)}</span>
          </p>
        </div>

        <div
          className={`flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 ${getScoreColor(
            score
          )}`}
        >
          <span className="text-4xl font-extrabold tracking-tight">{score}</span>
          <span className="text-xs font-medium uppercase tracking-wider mt-0.5">out of 100</span>
        </div>
      </div>

      {/* Multi-Dimensional Breakdown */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Score Breakdown by Dimension
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map((dim) => (
            <div key={dim.key} className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-800">{dim.label}</span>
                <span className="text-xs font-bold text-gray-700">{dim.value}%</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{dim.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getBarColor(dim.value)}`}
                  style={{ width: `${Math.min(100, Math.max(5, dim.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recruiter Summary */}
      {summary && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1">
            Recruiter's Executive Verdict
          </h4>
          <p className="text-sm text-indigo-950 leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  );
}

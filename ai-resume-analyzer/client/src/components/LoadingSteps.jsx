import { useState, useEffect } from "react";

const STEPS = [
  {
    id: 1,
    title: "Extracting document content",
    description: "Parsing text from PDF / Word DOCX and sanitizing format...",
    icon: "📄",
  },
  {
    id: 2,
    title: "Keyword & skill gap comparison",
    description: "Matching technical competencies against job description requirements...",
    icon: "🔍",
  },
  {
    id: 3,
    title: "Calculating multi-dimensional ATS scores",
    description: "Evaluating skills match, experience seniority, impact metrics, and readability...",
    icon: "📊",
  },
  {
    id: 4,
    title: "Formulating high-impact rewrites",
    description: "Drafting quantified bullet rewrites and strategic recommendations...",
    icon: "✍️",
  },
];

export default function LoadingSteps() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStepIndex(1), 1800);
    const timer2 = setTimeout(() => setCurrentStepIndex(2), 3800);
    const timer3 = setTimeout(() => setCurrentStepIndex(3), 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const progressPercent = Math.min(
    95,
    Math.round(((currentStepIndex + 0.6) / STEPS.length) * 100)
  );

  return (
    <div className="max-w-2xl mx-auto my-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
          <svg
            className="animate-spin h-6 w-6 text-indigo-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Running Comprehensive ATS Evaluation
        </h3>
        <p className="text-xs text-slate-500">
          Our LLM engine is evaluating your resume with recruiter-grade rigor
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Analysis Progress</span>
          <span className="text-indigo-600">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3 pt-2">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isPending = idx > currentStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all duration-300 ${
                isActive
                  ? "bg-indigo-50/70 border-indigo-200 scale-[1.01] shadow-2xs"
                  : isDone
                  ? "bg-emerald-50/40 border-emerald-100"
                  : "bg-slate-50/50 border-slate-100 opacity-50"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  isDone
                    ? "bg-emerald-600 text-white"
                    : isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {isDone ? "✓" : isActive ? "▶" : step.id}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-xs font-bold ${
                      isActive
                        ? "text-indigo-950"
                        : isDone
                        ? "text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  {isActive && (
                    <span className="text-[10px] font-semibold text-indigo-600 animate-pulse uppercase tracking-wider">
                      In progress...
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-semibold text-emerald-600">
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-[11px] text-slate-400 italic">
          💡 Tip: Resumes with strong quantifiable metrics score significantly higher in the impact dimension.
        </p>
      </div>
    </div>
  );
}

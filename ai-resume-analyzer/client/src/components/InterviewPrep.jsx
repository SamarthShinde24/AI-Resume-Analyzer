import { useState } from "react";
import { generateInterviewPrep } from "../api.js";

export default function InterviewPrep({ file, jobDescription, onToast }) {
  const [prepData, setPrepData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateInterviewPrep({ file, jobDescription });
      setPrepData(data);
      if (data.questions?.length > 0) {
        setExpandedId(data.questions[0].id);
      }
      if (onToast) onToast("Interview questions generated successfully!");
    } catch (err) {
      setError(err.message || "Failed to generate interview prep.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (question) => {
    const starText = `QUESTION: ${question.question}
COMPETENCY: ${question.target_competency}

MODEL ANSWER (STAR METHOD):
[Situation]
${question.model_answer.situation}

[Task]
${question.model_answer.task}

[Action]
${question.model_answer.action}

[Result]
${question.model_answer.result}

INTERVIEWER CHECKLIST:
${question.interviewer_checklist.map((c) => `- ${c}`).join("\n")}`;

    navigator.clipboard.writeText(starText);
    if (onToast) onToast("Copied STAR model answer to clipboard!");
  };

  const questions = prepData?.questions || [];
  const filteredQuestions = questions.filter((q) => {
    if (filter === "all") return true;
    return q.type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
              <span>🎯 STAR Method Framework</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Behavioral & Technical Interview Coach
            </h2>
            <p className="text-xs text-slate-500 pt-1">
              Top targeted questions hiring teams ask for this role with structured model answers.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white transition flex items-center gap-2 cursor-pointer shadow-sm ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
            }`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating STAR Answers...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>{prepData ? "Regenerate Questions" : "Generate Top 5 Questions"}</span>
              </>
            )}
          </button>
        </div>

        {prepData?.prep_strategy && (
          <div className="mt-5 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                Executive Interview Strategy ({prepData.role_title})
              </span>
              <p className="text-xs text-indigo-950 leading-relaxed font-normal">
                {prepData.prep_strategy}
              </p>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Initial Call-to-action placeholder if not yet generated */}
      {!prepData && !loading && !error && (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">
            🎙️
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              Prepare for the Hiring Manager Loop
            </h3>
            <p className="text-xs text-slate-500">
              Generate 5 targeted questions focusing on your identified skill gaps and core requirements.
              Each question includes a model answer formatted in Situation, Task, Action, and Result.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-sm transition"
          >
            Generate STAR Interview Prep
          </button>
        </div>
      )}

      {/* Questions list & interactive answers */}
      {prepData && (
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === "all" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Questions ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("technical")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === "technical"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Technical ({questions.filter((q) => q.type === "technical").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("behavioral")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === "behavioral"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Behavioral ({questions.filter((q) => q.type === "behavioral").length})
            </button>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedId === q.id;
              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {q.type}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100">
                          {q.target_competency}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(q)}
                        className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white transition cursor-pointer"
                      >
                        Copy Answer
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-indigo-50 transition cursor-pointer"
                      >
                        {isExpanded ? "Hide Answer ▲" : "View STAR Answer ▼"}
                      </button>
                    </div>
                  </div>

                  {/* Why asked context */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-start gap-2">
                    <span className="text-slate-400 font-bold shrink-0">Probe:</span>
                    <span>{q.why_asked}</span>
                  </div>

                  {/* Expanded STAR Framework breakdown */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>STAR Model Answer Breakdown</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                            <span className="w-5 h-5 rounded-full bg-sky-200 text-sky-900 flex items-center justify-center text-[10px]">
                              S
                            </span>
                            <span>Situation</span>
                          </div>
                          <p className="text-xs text-sky-950 leading-relaxed font-normal">
                            {q.model_answer.situation}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px]">
                              T
                            </span>
                            <span>Task</span>
                          </div>
                          <p className="text-xs text-amber-950 leading-relaxed font-normal">
                            {q.model_answer.task}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                            <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px]">
                              A
                            </span>
                            <span>Action</span>
                          </div>
                          <p className="text-xs text-emerald-950 leading-relaxed font-normal">
                            {q.model_answer.action}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                            <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-[10px]">
                              R
                            </span>
                            <span>Result (Metrics & Impact)</span>
                          </div>
                          <p className="text-xs text-indigo-950 leading-relaxed font-normal">
                            {q.model_answer.result}
                          </p>
                        </div>
                      </div>

                      {q.interviewer_checklist?.length > 0 && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Key Signals Interviewer Listens For:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {q.interviewer_checklist.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                              >
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>{item}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

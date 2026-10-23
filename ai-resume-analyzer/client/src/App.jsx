import { useState } from "react";
import UploadForm from "./components/UploadForm.jsx";
import ScoreCard from "./components/ScoreCard.jsx";
import SkillGaps from "./components/SkillGaps.jsx";
import BulletRewrites from "./components/BulletRewrites.jsx";
import TailorResume from "./components/TailorResume.jsx";
import LoadingSteps from "./components/LoadingSteps.jsx";
import FullAudit from "./components/FullAudit.jsx";
import { analyzeResume } from "./api.js";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("scores");
  const [currentFile, setCurrentFile] = useState(null);
  const [currentJd, setCurrentJd] = useState("");

  const handleSubmit = async (file, jobDescription) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentFile(file);
    setCurrentJd(jobDescription);

    try {
      const data = await analyzeResume(file, jobDescription);
      setResult(data);
      setActiveTab("overview");
    } catch (err) {
      setError(err.message || "Failed to analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCurrentFile(null);
    setCurrentJd("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🎯
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                AI Resume & ATS Analyzer
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Multi-Dimensional Scoring • DOCX & PDF • Tailored Generation
              </p>
            </div>
          </div>

          {result && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition"
            >
              ← Analyze New Resume
            </button>
          )}
        </div>
      </header>

      {/* Hero Intro */}
      <main className="max-w-4xl mx-auto px-4 pt-10">
        {!result && (
          <div className="text-center mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
              <span>🚀 Upgraded ATS Engine</span>
              <span className="text-indigo-300">•</span>
              <span>Groq, Anthropic & OpenAI</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Optimize Your Resume for Any Job
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Upload your resume in PDF or DOCX format alongside a target job description for a
              rigorous multi-dimensional ATS score, keyword gap audit, and instant bullet rewrites.
            </p>
          </div>
        )}

        {/* Loading Progress State */}
        {loading && <LoadingSteps />}

        {/* Upload Form */}
        {!result && !loading && <UploadForm onSubmit={handleSubmit} loading={loading} />}

        {/* Error Alert */}
        {error && (
          <div className="max-w-3xl mx-auto mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <span className="text-rose-500 font-bold">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold">Analysis Failed</p>
              <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Analysis Results View */}
        {result && (
          <div className="mt-4 space-y-6">
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-2 pt-2 gap-1 overflow-x-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                📊 Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("keywords")}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  activeTab === "keywords"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                🔍 Skills Breakdown (
                {result.keyword_checklist?.length ||
                  (result.matched_skills?.length || 0) + (result.missing_skills?.length || 0)}
                )
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rewrites")}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  activeTab === "rewrites"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                ✍️ Bullet Rewrites ({result.weak_bullets?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  activeTab === "audit"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                📑 Full Audit Report
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tailor")}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  activeTab === "tailor"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                ✨ Tailor My Resume
              </button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-6">
              {activeTab === "overview" && (
                <ScoreCard
                  score={result.match_score}
                  summary={result.summary}
                  breakdown={result.score_breakdown}
                />
              )}

              {activeTab === "keywords" && (
                <SkillGaps
                  matched={result.matched_skills}
                  missing={result.missing_skills}
                  checklist={result.keyword_checklist}
                />
              )}

              {activeTab === "rewrites" && (
                <BulletRewrites bullets={result.weak_bullets} />
              )}

              {activeTab === "audit" && (
                <FullAudit
                  score={result.match_score}
                  breakdown={result.score_breakdown}
                  summary={result.summary}
                  checklist={result.keyword_checklist}
                  weakBullets={result.weak_bullets}
                />
              )}

              {activeTab === "tailor" && (
                <TailorResume
                  file={currentFile}
                  jobDescription={currentJd}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import UploadForm from "./components/UploadForm.jsx";
import ScoreCard from "./components/ScoreCard.jsx";
import SkillGaps from "./components/SkillGaps.jsx";
import BulletRewrites from "./components/BulletRewrites.jsx";
import TailorResume from "./components/TailorResume.jsx";
import LoadingSteps from "./components/LoadingSteps.jsx";
import FullAudit from "./components/FullAudit.jsx";
import Toast from "./components/Toast.jsx";
import ExportModal from "./components/ExportModal.jsx";
import VersionHistory from "./components/VersionHistory.jsx";
import VersionCompareModal from "./components/VersionCompareModal.jsx";
import AtsTrapDetector from "./components/AtsTrapDetector.jsx";
import InterviewPrep from "./components/InterviewPrep.jsx";
import CoverLetterModal from "./components/CoverLetterModal.jsx";
import TailoredResumeExportModal from "./components/TailoredResumeExportModal.jsx";
import ResumeEditor from "./components/ResumeEditor.jsx";
import { analyzeResume } from "./api.js";
import { getHistory, saveAnalysis, extractRoleTitle } from "./services/historyService.js";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentFile, setCurrentFile] = useState(null);
  const [currentJd, setCurrentJd] = useState("");
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState(() => getHistory());
  const [activeVersionLabel, setActiveVersionLabel] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCoverLetterOpen, setIsCoverLetterOpen] = useState(false);
  const [isTailoredDocxOpen, setIsTailoredDocxOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState(null);

  const showToast = (message) => {
    setToast({ message, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 2600);
  };

  const handleRestoreVersion = (snapshot) => {
    setResult(snapshot.result);
    setCurrentFile({ name: snapshot.fileName });
    setCurrentJd(snapshot.jobDescription);
    setActiveVersionLabel(snapshot.versionLabel);
    setActiveTab("overview");
    setIsHistoryOpen(false);
    showToast(`Restored snapshot ${snapshot.versionLabel} (${snapshot.score}% match)`);
  };

  const handleOpenComparison = (vOld, vNew) => {
    setCompareVersions({ vOld, vNew });
    setIsHistoryOpen(false);
  };

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

      // Auto-save snapshot into version history
      const snapshot = saveAnalysis(data, {
        fileName: file.name,
        jobDescription,
        roleTitle: extractRoleTitle(jobDescription),
      });

      if (snapshot) {
        setHistory(getHistory());
        setActiveVersionLabel(snapshot.versionLabel);
        showToast(`Saved analysis as ${snapshot.versionLabel} (${snapshot.score}% match)`);
      }
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
    setActiveVersionLabel(null);
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
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  AI Resume & ATS Analyzer
                </h1>
                {activeVersionLabel && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    {activeVersionLabel}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Multi-Dimensional Scoring • DOCX & PDF • Tailored Generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>📜 History</span>
              {history.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {history.length}
                </span>
              )}
            </button>

            {result && (
              <>
                <button
                  type="button"
                  onClick={() => setIsTailoredDocxOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>📄 Tailored Docx</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCoverLetterOpen(true)}
                  className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>✉️ Cover Letter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExportOpen(true)}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>📥 Export Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition cursor-pointer"
                >
                  ← New
                </button>
              </>
            )}
          </div>
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
                onClick={() => setActiveTab("traps")}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "traps"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span>🚨 ATS Traps</span>
                {result.ats_traps?.total_traps_found > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">
                    {result.ats_traps.total_traps_found}
                  </span>
                )}
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
                onClick={() => setActiveTab("editor")}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "editor"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span>✏️ Live Editor</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("interview")}
                className={`px-4 py-2.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  activeTab === "interview"
                    ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                🎯 Interview Prep (STAR)
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
            </div>

            {/* Tab Contents */}
            <div className="space-y-6">
              {activeTab === "overview" && (
                <ScoreCard
                  score={result.match_score}
                  summary={result.summary}
                  breakdown={result.score_breakdown}
                  hybridScore={result.hybrid_score}
                  semanticAnalysis={result.semantic_analysis}
                  onOpenEditor={() => setActiveTab("editor")}
                />
              )}

              {activeTab === "traps" && (
                <AtsTrapDetector
                  trapsData={result.ats_traps}
                  onToast={showToast}
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
                <BulletRewrites
                  bullets={result.weak_bullets}
                  onToast={showToast}
                />
              )}

              {activeTab === "editor" && (
                <ResumeEditor
                  initialResumeText={result.resume_text || ""}
                  jobDescription={currentJd}
                  checklist={result.keyword_checklist || []}
                  weakBullets={result.weak_bullets || []}
                  baseScore={result.match_score || 60}
                  onSaveVersion={(newText, newScore) => {
                    const snapshot = saveAnalysis(
                      {
                        ...result,
                        match_score: newScore,
                        resume_text: newText,
                      },
                      {
                        fileName: currentFile?.name || "Edited_Resume.txt",
                        jobDescription: currentJd,
                        roleTitle: extractRoleTitle(currentJd),
                      }
                    );
                    if (snapshot) {
                      setHistory(getHistory());
                      setActiveVersionLabel(snapshot.versionLabel);
                      showToast(`Saved live edit as ${snapshot.versionLabel} (${newScore}% match)!`);
                    }
                  }}
                  onOpenDocxModal={() => setIsTailoredDocxOpen(true)}
                  onToast={showToast}
                />
              )}

              {activeTab === "interview" && (
                <InterviewPrep
                  file={currentFile}
                  jobDescription={currentJd}
                  onToast={showToast}
                />
              )}

              {activeTab === "tailor" && (
                <TailorResume
                  file={currentFile}
                  jobDescription={currentJd}
                  onToast={showToast}
                />
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
            </div>
          </div>
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        result={result}
        meta={{
          fileName: currentFile?.name,
          roleTitle: extractRoleTitle(currentJd),
        }}
        onToast={showToast}
      />

      {/* Cover Letter Modal */}
      <CoverLetterModal
        isOpen={isCoverLetterOpen}
        onClose={() => setIsCoverLetterOpen(false)}
        file={currentFile}
        jobDescription={currentJd}
        onToast={showToast}
      />

      {/* Tailored Resume DOCX & PDF Export Modal */}
      <TailoredResumeExportModal
        isOpen={isTailoredDocxOpen}
        onClose={() => setIsTailoredDocxOpen(false)}
        resumeText={result?.resume_text || ""}
        weakBullets={result?.weak_bullets || []}
        candidateName={currentFile?.name ? currentFile.name.replace(/\.[^/.]+$/, "") : "Candidate"}
        onToast={showToast}
      />

      {/* Version History Drawer */}
      <VersionHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectVersion={handleRestoreVersion}
        onCompareVersions={handleOpenComparison}
        onHistoryChange={(newHistory) => setHistory(newHistory)}
        onToast={showToast}
      />

      {/* Version Comparison Modal */}
      <VersionCompareModal
        isOpen={Boolean(compareVersions)}
        onClose={() => setCompareVersions(null)}
        vOld={compareVersions?.vOld}
        vNew={compareVersions?.vNew}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Global Floating Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

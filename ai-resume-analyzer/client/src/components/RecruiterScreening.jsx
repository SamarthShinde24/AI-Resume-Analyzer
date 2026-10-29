import { useState, useRef, useMemo } from "react";
import { batchScreenResumes, scrapeJobUrl } from "../api.js";
import { SAMPLE_PRESETS } from "../data/samplePresets.js";

const DEFAULT_SAMPLE_JD = `Senior Full-Stack Engineer
Company: Acme Cloud Solutions
Location: Remote

Responsibilities:
• Architect, deploy, and scale robust distributed microservices using Node.js, TypeScript, and React.
• Implement high-throughput caching and persistence layers with Redis, PostgreSQL, and DynamoDB.
• Own cloud infrastructure, CI/CD pipelines, and containerization using Docker, Kubernetes, and AWS (ECS, Lambda, CloudWatch).
• Lead technical design reviews and collaborate with cross-functional product and design teams.

Requirements:
• 5+ years of full-stack software engineering experience in high-growth environments.
• Deep expertise in React, Node.js, TypeScript, and modern asynchronous architecture.
• Hands-on experience with Docker, CI/CD, Kubernetes, and AWS cloud services.
• Strong foundation in system design, database indexing, and REST/GraphQL API design.`;

export default function RecruiterScreening({ onToast }) {
  const [jobDescription, setJobDescription] = useState(DEFAULT_SAMPLE_JD);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [jobUrl, setJobUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [expandedCandId, setExpandedCandId] = useState(null);

  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const handleFileChange = (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;
    const valid = Array.from(newFiles).filter((f) => {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      return [".pdf", ".docx", ".doc", ".txt"].includes(ext) && f.size <= 5 * 1024 * 1024;
    });

    setFiles((prev) => {
      const merged = [...prev, ...valid];
      // Deduplicate by name
      const unique = [];
      const seen = new Set();
      for (const item of merged) {
        if (!seen.has(item.name)) {
          seen.add(item.name);
          unique.push(item);
        }
      }
      return unique.slice(0, 15);
    });
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadSampleBatch = () => {
    const sampleFiles = [
      new File(
        [SAMPLE_PRESETS[0]?.resumeText || "Senior Software Engineer with React, Node, Docker"],
        "Alex_Morgan_Senior_FullStack.txt",
        { type: "text/plain" }
      ),
      new File(
        [SAMPLE_PRESETS[1]?.resumeText || "Machine Learning Engineer with Python, PyTorch, LangChain"],
        "Jordan_Lee_AI_Engineer.txt",
        { type: "text/plain" }
      ),
      new File(
        [
          "Taylor Smith\nEmail: taylor@example.com\nSUMMARY\nJunior Frontend Developer with 1 year experience building UI with HTML, CSS, and basic JavaScript.\nEDUCATION\nBS Information Systems\nSKILLS\nHTML, CSS, JavaScript, Git",
        ],
        "Taylor_Smith_Junior_Frontend.txt",
        { type: "text/plain" }
      ),
    ];

    setFiles(sampleFiles);
    setJobDescription(DEFAULT_SAMPLE_JD);
    if (onToast) onToast("Loaded 3 sample candidate resumes into batch!");
  };

  const handleScrapeUrl = async () => {
    if (!jobUrl || !jobUrl.trim()) return;
    setUrlLoading(true);
    setUrlError(null);
    try {
      const data = await scrapeJobUrl(jobUrl.trim());
      setJobDescription(data.description);
      setJobUrl("");
      if (onToast) onToast(`Imported ${data.title} at ${data.company}!`);
    } catch (err) {
      setUrlError(err.message || "Failed to scrape job link.");
    } finally {
      setUrlLoading(false);
    }
  };

  const handleScreenBatch = async () => {
    if (files.length === 0) {
      setError("Please select at least one resume file to screen.");
      return;
    }
    if (!jobDescription || jobDescription.trim().length < 20) {
      setError("Please provide a target job description (minimum 20 characters).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await batchScreenResumes(files, jobDescription.trim());
      setResults(data);
      if (onToast) {
        onToast(`Screened ${data.summary.total_screened} resumes! Top score: ${data.summary.top_score}%`);
      }
    } catch (err) {
      setError(err.message || "Failed to process batch screening.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!results?.leaderboard) return;
    const headers = [
      "Rank",
      "Candidate Name",
      "Overall Score",
      "Semantic Vector Score",
      "ATS Health Score",
      "Status",
      "File Name",
      "Top Matched Skills",
    ];

    const rows = results.leaderboard.map((c) => [
      c.rank,
      `"${c.candidate_name.replace(/"/g, '""')}"`,
      `${c.score}%`,
      `${c.semantic_score}%`,
      `${c.ats_health_score}%`,
      `"${c.status}"`,
      `"${c.file_name}"`,
      `"${c.matched_keywords.map((k) => k.term).join("; ")}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Candidate_Leaderboard_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onToast) onToast("Exported candidate shortlist as CSV!");
  };

  const filteredLeaderboard = useMemo(() => {
    if (!results?.leaderboard) return [];
    return results.leaderboard.filter((c) => {
      const matchesSearch =
        c.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.matched_keywords.some((k) => k.term.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesScore = c.score >= minScoreFilter;
      return matchesSearch && matchesScore;
    });
  }, [results, searchQuery, minScoreFilter]);

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: "🥇", style: "bg-amber-100 text-amber-800 border-amber-300 font-black" };
    if (rank === 2) return { icon: "🥈", style: "bg-slate-200 text-slate-800 border-slate-300 font-bold" };
    if (rank === 3) return { icon: "🥉", style: "bg-amber-50 text-amber-900 border-amber-200 font-bold" };
    return { icon: `#${rank}`, style: "bg-slate-50 text-slate-600 border-slate-200" };
  };

  return (
    <div className="space-y-6">
      {/* Header Intro */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
              <span>👔 Recruiter SaaS Mode</span>
              <span className="text-indigo-300">•</span>
              <span>Multi-Candidate Screening</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Batch Resume Screening & Leaderboard
            </h2>
            <p className="text-xs text-slate-500 pt-1">
              Screen up to 15 resumes simultaneously against 1 job description to produce an instant ranked candidate leaderboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSampleBatch}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>⚡ Load Sample Batch (3 Resumes)</span>
            </button>
          </div>
        </div>

        {/* Inputs Layout: Job Description & Multi-File Dropzone */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          {/* Left: Job Description (6 cols) */}
          <div className="lg:col-span-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Target Role Job Description
              </label>
              <span className="text-[11px] text-slate-400">
                {jobDescription.length} characters
              </span>
            </div>

            {/* URL scraper bar */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="Or paste JD URL (Greenhouse, Lever)..."
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={handleScrapeUrl}
                disabled={urlLoading || !jobUrl.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white cursor-pointer disabled:opacity-50"
              >
                {urlLoading ? "Fetching..." : "Fetch"}
              </button>
            </div>
            {urlError && <p className="text-[11px] text-rose-600">{urlError}</p>}

            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description requirements, responsibilities, and qualifications..."
              className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
            />
          </div>

          {/* Right: Multi-File Resume Uploader (6 cols) */}
          <div className="lg:col-span-6 space-y-2.5 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Candidate Resumes ({files.length} / 15 selected)
              </label>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileChange(e.dataTransfer.files);
              }}
              className="flex-1 border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20 rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer transition min-h-[160px]"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
              />
              <span className="text-2xl mb-1">📂</span>
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drop multiple resumes
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PDF, DOCX, or TXT (up to 15 candidates, max 5MB each)
              </p>
            </div>

            {/* Selected Files Chips */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-200">
                {files.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 shadow-2xs"
                  >
                    <span className="font-bold text-indigo-600 text-[10px]">
                      {file.name.split(".").pop()?.toUpperCase()}
                    </span>
                    <span className="truncate max-w-[140px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Screening Submit Action */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {files.length === 0
              ? "Select resumes above or click 'Load Sample Batch' to preview."
              : `Ready to evaluate ${files.length} candidate${files.length > 1 ? "s" : ""} across semantic vectors and ATS health.`}
          </p>

          <button
            type="button"
            onClick={handleScreenBatch}
            disabled={loading || files.length === 0 || jobDescription.trim().length < 20}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Screening {files.length} Candidates...</span>
              </>
            ) : (
              <>
                <span>🚀 Screen All Candidates</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Leaderboard Results View */}
      {results && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Screened
              </span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {results.summary.total_screened}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Candidates evaluated</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Average ATS Score
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-0.5">
                {results.summary.average_score}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Batch compatibility mean</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Top Candidate 🥇
              </span>
              <div className="text-base font-extrabold text-slate-900 mt-1 truncate">
                {results.summary.top_candidate}
              </div>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                High score: {results.summary.top_score}%
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Qualified Shortlist
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">
                {results.summary.qualified_count} / {results.summary.total_screened}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Score &ge; 65% benchmark</p>
            </div>
          </div>

          {/* Filter & Export Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name or skill..."
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white w-full sm:w-64"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <span className="text-slate-500 text-[11px]">Score Threshold:</span>
              <div className="flex items-center gap-1">
                {[0, 65, 80].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMinScoreFilter(val)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      minScoreFilter === val
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {val === 0 ? "All" : `${val}%+`}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                className="ml-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Ranked Candidate Leaderboard Cards */}
          <div className="space-y-3">
            {filteredLeaderboard.map((cand) => {
              const rankInfo = getRankBadge(cand.rank);
              const isExpanded = expandedCandId === cand.id;

              return (
                <div
                  key={cand.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs hover:border-indigo-200 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Rank & Candidate Identity */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm border shrink-0 ${rankInfo.style}`}
                      >
                        {rankInfo.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-900">
                            {cand.candidate_name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cand.status_badge}`}
                          >
                            {cand.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          {cand.file_name} • {cand.file_size}
                        </p>
                      </div>
                    </div>

                    {/* Score Gauges & Breakdown */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900 font-mono">
                          {cand.score}%
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Composite Fit
                        </div>
                      </div>

                      <div className="h-8 w-[1px] bg-slate-200" />

                      <div className="text-xs space-y-0.5">
                        <div className="text-[11px] text-slate-600">
                          Vector Cosine: <strong>{cand.semantic_score}%</strong>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          ATS Health: <strong>{cand.ats_health_score}%</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedCandId(isExpanded ? null : cand.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-indigo-50 transition cursor-pointer"
                      >
                        {isExpanded ? "Hide Details ▲" : "View Details ▼"}
                      </button>
                    </div>
                  </div>

                  {/* Top Matched Vector Keywords */}
                  {cand.matched_keywords?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 mr-1">
                        Top Vectors:
                      </span>
                      {cand.matched_keywords.slice(0, 7).map((kw, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1"
                        >
                          <span>{kw.term}</span>
                          <span className="text-[8px] font-mono text-indigo-500 bg-indigo-50 px-1 rounded">
                            {kw.weight}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expandable Snippet & Diagnostics */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 space-y-2 animate-fadeIn text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {cand.snippet}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>🚨 Critical Traps: {cand.critical_traps_count}</span>
                        <span>•</span>
                        <span>⚠️ Warnings: {cand.warnings_count}</span>
                        <span>•</span>
                        <span>Cosine Distance: {cand.cosine_distance}</span>
                      </div>
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

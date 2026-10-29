import { useState, useMemo } from "react";
import {
  STAGES,
  getKanbanJobs,
  saveKanbanJob,
  updateJobStage,
  deleteKanbanJob,
  getKanbanStats,
} from "../services/kanbanService.js";

export default function JobKanban({ onToast }) {
  const [jobs, setJobs] = useState(() => getKanbanJobs());
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Form State for Add / Edit Modal
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    stage: "saved",
    matchScore: 80,
    resumeVersion: "v1",
    location: "Remote",
    salary: "",
    notes: "",
    url: "",
  });

  const stats = useMemo(() => getKanbanStats(jobs), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        (j.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.location || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesScore = (j.matchScore || 0) >= minScore;
      return matchesSearch && matchesScore;
    });
  }, [jobs, searchQuery, minScore]);

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setFormData({
      company: "",
      role: "",
      stage: "saved",
      matchScore: 80,
      resumeVersion: "v1",
      location: "Remote",
      salary: "",
      notes: "",
      url: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
    setFormData({
      company: job.company || "",
      role: job.role || "",
      stage: job.stage || "saved",
      matchScore: job.matchScore || 75,
      resumeVersion: job.resumeVersion || "v1",
      location: job.location || "Remote",
      salary: job.salary || "",
      notes: job.notes || "",
      url: job.url || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveJob = (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) {
      return;
    }

    const payload = editingJob ? { ...formData, id: editingJob.id } : formData;
    saveKanbanJob(payload);
    setJobs(getKanbanJobs());
    setIsModalOpen(false);
    if (onToast) {
      onToast(editingJob ? "Job application updated!" : "Added job to tracking pipeline!");
    }
  };

  const handleMoveStage = (jobId, newStage, stageLabel) => {
    updateJobStage(jobId, newStage);
    setJobs(getKanbanJobs());
    if (onToast) onToast(`Moved job to ${stageLabel}!`);
  };

  const handleDelete = (jobId, company) => {
    const updated = deleteKanbanJob(jobId);
    setJobs(updated);
    if (onToast) onToast(`Removed ${company} from pipeline.`);
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 65) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6">
      {/* Header & CRM Pipeline Metrics */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
              <span>💼 Job Search CRM</span>
              <span className="text-indigo-300">•</span>
              <span>Version Tracking</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Application Kanban Pipeline
            </h2>
            <p className="text-xs text-slate-500 pt-1">
              Track target jobs across stages linked to the exact resume version and match score used.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>➕</span>
            <span>Add Application</span>
          </button>
        </div>

        {/* CRM Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Tracked
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Across all pipeline stages</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Applications
            </span>
            <div className="text-xl font-black text-indigo-600 mt-0.5">{stats.applied}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Applied, Screening & Loops</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Interview Conversion
            </span>
            <div className="text-xl font-black text-amber-600 mt-0.5">{stats.interviewRate}%</div>
            <p className="text-[10px] text-slate-500 mt-0.5">{stats.interviewing} in interview loops</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Offers Received
            </span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{stats.offers}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Offer rate: {stats.offerRate}%</p>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, title, location..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <span className="text-slate-500 text-[11px]">Min Match Score:</span>
            <div className="flex items-center gap-1">
              {[0, 70, 80, 90].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMinScore(val)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    minScore === val
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {val === 0 ? "All" : `${val}%+`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {STAGES.filter((s) => s.id !== "rejected").map((stage, colIdx) => {
          const stageJobs = filteredJobs.filter((j) => j.stage === stage.id);
          const stageOrder = ["saved", "applied", "interviewing", "offer"];

          return (
            <div
              key={stage.id}
              className="bg-slate-50/70 border border-slate-200 rounded-3xl p-4 flex flex-col min-h-[500px] shadow-2xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-base">{stage.icon}</span>
                  <span className="text-xs font-extrabold text-slate-800 tracking-wide uppercase">
                    {stage.label}
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                  {stageJobs.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageJobs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    No jobs in {stage.label}
                  </div>
                ) : (
                  stageJobs.map((job) => {
                    const currentStageIdx = stageOrder.indexOf(job.stage);
                    const prevStage = currentStageIdx > 0 ? stageOrder[currentStageIdx - 1] : null;
                    const nextStage =
                      currentStageIdx < stageOrder.length - 1
                        ? stageOrder[currentStageIdx + 1]
                        : null;

                    return (
                      <div
                        key={job.id}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 shadow-2xs space-y-2.5 transition group"
                      >
                        {/* Company & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                              {job.company}
                            </h4>
                            <p className="text-xs font-medium text-slate-600 line-clamp-1">
                              {job.role}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(job)}
                              className="text-[10px] text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-50 cursor-pointer"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(job.id, job.company)}
                              className="text-[10px] text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-50 cursor-pointer"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Location / Salary */}
                        {(job.location || job.salary) && (
                          <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                            {job.location && (
                              <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                📍 {job.location}
                              </span>
                            )}
                            {job.salary && (
                              <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 font-mono">
                                💰 {job.salary}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Linked Resume Version & Score */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <span>📄</span>
                            <span>{job.resumeVersion || "v1"}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getScoreBadge(
                              job.matchScore
                            )}`}
                          >
                            <span>{job.matchScore}%</span>
                            <span className="font-normal text-[9px]">Match</span>
                          </span>
                        </div>

                        {/* Notes preview if any */}
                        {job.notes && (
                          <p className="text-[10px] text-slate-500 bg-slate-50/80 p-2 rounded-xl border border-slate-100 line-clamp-2">
                            {job.notes}
                          </p>
                        )}

                        {/* Stage Progression Arrows */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          {prevStage ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleMoveStage(
                                  job.id,
                                  prevStage,
                                  STAGES.find((s) => s.id === prevStage)?.label
                                )
                              }
                              className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                            >
                              ← {STAGES.find((s) => s.id === prevStage)?.label}
                            </button>
                          ) : (
                            <span />
                          )}

                          {nextStage && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMoveStage(
                                  job.id,
                                  nextStage,
                                  STAGES.find((s) => s.id === nextStage)?.label
                                )
                              }
                              className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
                            >
                              <span>{STAGES.find((s) => s.id === nextStage)?.label}</span>
                              <span>→</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingJob ? "Edit Job Application" : "Track New Job Application"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Stripe, Google"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Match Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.matchScore}
                    onChange={(e) => setFormData({ ...formData, matchScore: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Resume Version
                  </label>
                  <input
                    type="text"
                    value={formData.resumeVersion}
                    onChange={(e) => setFormData({ ...formData, resumeVersion: e.target.value })}
                    placeholder="e.g. v2 (Tailored)"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Remote, San Francisco"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g. $160k - $200k"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Interview Notes / Status Updates
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Record interview loops, contact persons, or next steps..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm cursor-pointer"
                >
                  {editingJob ? "Save Changes" : "Add to Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

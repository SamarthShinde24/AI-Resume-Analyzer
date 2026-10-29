/**
 * Job Application Kanban Pipeline CRM Service
 *
 * Persists job applications across pipeline stages (Saved, Applied, Interviewing, Offer, Rejected)
 * in localStorage, linking the exact resume version and match score used for each job.
 */

const STORAGE_KEY = "ai_resume_kanban_jobs_v1";

export const STAGES = [
  { id: "saved", label: "Saved", icon: "📌", color: "sky", badge: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "applied", label: "Applied", icon: "✉️", color: "indigo", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "interviewing", label: "Interviewing", icon: "🎙️", color: "amber", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "offer", label: "Offer Received", icon: "🎉", color: "emerald", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "rejected", label: "Archived", icon: "📁", color: "slate", badge: "bg-slate-100 text-slate-600 border-slate-200" },
];

const INITIAL_SAMPLE_JOBS = [
  {
    id: "job-sample-1",
    company: "Stripe",
    role: "Senior Full-Stack Engineer",
    stage: "interviewing",
    matchScore: 88,
    resumeVersion: "v2 (Tailored)",
    dateAdded: new Date(Date.now() - 4 * 86400000).toISOString(),
    location: "Remote / San Francisco",
    salary: "$180k - $220k",
    notes: "Completed Technical Screen. System Design loop scheduled for next Tuesday.",
    url: "https://stripe.com/jobs",
  },
  {
    id: "job-sample-2",
    company: "Linear",
    role: "Frontend Engineer (React / TypeScript)",
    stage: "applied",
    matchScore: 92,
    resumeVersion: "v2",
    dateAdded: new Date(Date.now() - 2 * 86400000).toISOString(),
    location: "Remote",
    salary: "$160k - $190k",
    notes: "Applied via Greenhouse with tailored cover letter.",
    url: "https://linear.app/careers",
  },
  {
    id: "job-sample-3",
    company: "Datadog",
    role: "Distributed Systems Engineer",
    stage: "saved",
    matchScore: 78,
    resumeVersion: "v1",
    dateAdded: new Date(Date.now() - 1 * 86400000).toISOString(),
    location: "New York, NY",
    salary: "$175k - $210k",
    notes: "Need to highlight Redis caching and Kafka experience before applying.",
    url: "https://datadoghq.com/careers",
  },
];

export function getKanbanJobs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_JOBS));
      return INITIAL_SAMPLE_JOBS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load kanban jobs from localStorage:", err);
    return INITIAL_SAMPLE_JOBS;
  }
}

export function saveKanbanJob(jobData) {
  const jobs = getKanbanJobs();
  const now = new Date().toISOString();

  if (jobData.id) {
    // Update existing job
    const index = jobs.findIndex((j) => j.id === jobData.id);
    if (index !== -1) {
      jobs[index] = {
        ...jobs[index],
        ...jobData,
        dateUpdated: now,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
      return jobs[index];
    }
  }

  // Create new job
  const newJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    company: jobData.company || "Target Company",
    role: jobData.role || "Target Role",
    stage: jobData.stage || "saved",
    matchScore: Number(jobData.matchScore) || 75,
    resumeVersion: jobData.resumeVersion || "v1",
    location: jobData.location || "Remote",
    salary: jobData.salary || "",
    notes: jobData.notes || "",
    url: jobData.url || "",
    dateAdded: now,
    dateUpdated: now,
  };

  jobs.unshift(newJob);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  return newJob;
}

export function updateJobStage(jobId, newStage) {
  const jobs = getKanbanJobs();
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return null;

  job.stage = newStage;
  job.dateUpdated = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  return job;
}

export function deleteKanbanJob(jobId) {
  const jobs = getKanbanJobs();
  const filtered = jobs.filter((j) => j.id !== jobId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

export function getKanbanStats(jobs = []) {
  const list = jobs.length > 0 ? jobs : getKanbanJobs();
  const total = list.length;
  const applied = list.filter((j) => ["applied", "interviewing", "offer"].includes(j.stage)).length;
  const interviewing = list.filter((j) => ["interviewing", "offer"].includes(j.stage)).length;
  const offers = list.filter((j) => j.stage === "offer").length;

  const interviewRate = applied > 0 ? Math.round((interviewing / applied) * 100) : 0;
  const offerRate = applied > 0 ? Math.round((offers / applied) * 100) : 0;

  return {
    total,
    applied,
    interviewing,
    offers,
    interviewRate,
    offerRate,
  };
}


export function exportKanbanToCSV(jobs = []) {
  const list = jobs.length > 0 ? jobs : getKanbanJobs();
  const headers = [
    "Company",
    "Role",
    "Stage",
    "Match Score",
    "Resume Version",
    "Location",
    "Salary",
    "Date Added",
    "Notes",
    "Job URL",
  ];

  const rows = list.map((j) => [
    `"${(j.company || "").replace(/"/g, '""')}"`,
    `"${(j.role || "").replace(/"/g, '""')}"`,
    `"${(j.stage || "").replace(/"/g, '""')}"`,
    j.matchScore || 0,
    `"${(j.resumeVersion || "").replace(/"/g, '""')}"`,
    `"${(j.location || "").replace(/"/g, '""')}"`,
    `"${(j.salary || "").replace(/"/g, '""')}"`,
    `"${(j.dateAdded || "").replace(/"/g, '""')}"`,
    `"${(j.notes || "").replace(/"/g, '""')}"`,
    `"${(j.url || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function exportKanbanToJSON(jobs = []) {
  const list = jobs.length > 0 ? jobs : getKanbanJobs();
  return JSON.stringify(list, null, 2);
}

export function resetToSampleJobs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_JOBS));
  return INITIAL_SAMPLE_JOBS;
}

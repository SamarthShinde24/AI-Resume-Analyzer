import { useState } from "react";
import { updateUserRole } from "../services/authClient.js";

export default function UserProfileDrawer({
  isOpen,
  onClose,
  user,
  historyCount = 0,
  kanbanCount = 0,
  onTriggerSync,
  onLogout,
  onToast,
  onUserUpdate,
}) {
  const [syncing, setSyncing] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  if (!isOpen || !user) return null;

  const currentRole = user.role || "job_seeker";

  const handleRoleSwitch = async (targetRole) => {
    if (targetRole === currentRole) return;
    setUpdatingRole(true);
    try {
      const updatedUser = await updateUserRole(targetRole);
      if (onUserUpdate) onUserUpdate(updatedUser);
      if (onToast) onToast(`Account role switched to '${targetRole}'!`);
    } catch (err) {
      if (onToast) onToast(err.message || "Failed to change role.");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      if (onTriggerSync) {
        await onTriggerSync();
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.created_at,
        },
        localHistory: JSON.parse(localStorage.getItem("ai_resume_history_v1") || "[]"),
        localKanban: JSON.parse(localStorage.getItem("ai_resume_kanban_jobs_v1") || "[]"),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume_analyzer_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (onToast) onToast("Exported full account backup JSON!");
    } catch {
      if (onToast) onToast("Failed to generate account backup.");
    }
  };

  const initial = (user.name || user.email || "U")[0].toUpperCase();

  const getRoleBadge = (role) => {
    switch (role) {
      case "recruiter":
        return {
          label: "🏢 Recruiter (Screening Enabled)",
          classes: "bg-emerald-100 text-emerald-800 border-emerald-300",
        };
      case "admin":
        return {
          label: "⚡ Administrator (Full Access)",
          classes: "bg-purple-100 text-purple-800 border-purple-300",
        };
      case "job_seeker":
      default:
        return {
          label: "👤 Job Seeker (Standard)",
          classes: "bg-blue-100 text-blue-800 border-blue-300",
        };
    }
  };

  const roleBadge = getRoleBadge(currentRole);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slideLeft">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
                <span>👤 Cloud Account</span>
                <span className="text-indigo-300">•</span>
                <span>RBAC & Settings</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">User Profile & Cloud Sync</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition font-bold"
            >
              ✕
            </button>
          </div>

          {/* Profile Identity Card */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                {initial}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-extrabold text-slate-900 truncate">
                    {user.name || "Resume Builder"}
                  </h4>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.classes}`}
                  >
                    {roleBadge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono truncate">{user.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cloud Synchronized (SQLite)
                  </span>
                </div>
              </div>
            </div>

            {/* Role-Based Access Control (RBAC) Switcher */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Role-Based Access Control (RBAC)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">SQLite Protected</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Roles govern endpoint permissions. Recruiter and Admin accounts can screen up to 15 resumes concurrently via the Batch Screening engine.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch("job_seeker")}
                  disabled={updatingRole || currentRole === "job_seeker"}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                    currentRole === "job_seeker"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>👤 Job Seeker</span>
                  {currentRole === "job_seeker" && <span className="text-[10px]">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSwitch("recruiter")}
                  disabled={updatingRole || currentRole === "recruiter"}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                    currentRole === "recruiter"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  <span>🏢 Recruiter</span>
                  {currentRole === "recruiter" && <span className="text-[10px]">✓</span>}
                </button>
              </div>
            </div>

            {/* Account Storage Stats */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cloud Synchronized Assets
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Analyses Saved</span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{historyCount}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Resume snapshots</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Tracked Jobs</span>
                  <div className="text-xl font-black text-indigo-600 mt-0.5">{kanbanCount}</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">In Kanban CRM</p>
                </div>
              </div>
            </div>

            {/* Database Engine & Security Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Security Architecture
              </span>
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-500">Rate Limiting:</span>
                <span className="font-bold text-slate-800 font-mono">express-rate-limit (Sliding Window)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-500">HTTP Header Security:</span>
                <span className="font-bold text-slate-800 font-mono">Helmet (CSP, nosniff, DENY)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/70">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-bold text-slate-800 font-mono">SQLite (Prepared Statements)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Authentication:</span>
                <span className="font-bold text-emerald-600 font-mono">Signed JWT + Bcrypt</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Data Management
              </span>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{syncing ? "🔄" : "☁️"}</span>
                <span>{syncing ? "Syncing with Cloud Database..." : "Force Cloud Sync Now"}</span>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📥</span>
                <span>Export Full Account Backup (.json)</span>
              </button>
            </div>
          </div>

          {/* Footer with Sign Out */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
              className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🚪 Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

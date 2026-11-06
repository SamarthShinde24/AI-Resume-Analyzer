import { useState } from "react";
import { registerUser, loginUser } from "../services/authClient.js";

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onToast }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("job_seeker"); // "job_seeker" | "recruiter"
  const [autoSync, setAutoSync] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (mode === "register") {
        result = await registerUser({ email, password, name, role });
        if (onToast) onToast(`Welcome aboard, ${result.user.name || result.user.email}! Account created as ${result.user.role}.`);
      } else {
        result = await loginUser({ email, password });
        if (onToast) onToast(`Welcome back, ${result.user.name || result.user.email}! Signed in (${result.user.role || "job_seeker"}).`);
      }

      if (onAuthSuccess) {
        onAuthSuccess(result.user, autoSync);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Mode Tabs */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span>☁️ Cloud Database Sync</span>
              <span className="text-indigo-300">•</span>
              <span>SQLite</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition font-bold"
            >
              ✕
            </button>
          </div>

          <h3 className="text-xl font-black text-slate-900 mt-2">
            {mode === "login" ? "Sign In to Your Account" : "Create Cloud Account"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sync your resume versions, ATS audits, and Kanban applications across devices.
          </p>

          <div className="flex bg-slate-200/70 p-1 rounded-xl mt-4">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mode === "login" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mode === "register" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {mode === "register" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Account Role (RBAC)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("job_seeker")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                      role === "job_seeker"
                        ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <span>👤</span>
                      <span>Job Seeker</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      ATS Audit, Live Editor & Kanban
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("recruiter")}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                      role === "recruiter"
                        ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs">
                      <span>🏢</span>
                      <span>Recruiter</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Batch Screening & Leaderboard
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <label className="flex items-start gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-600">
              Automatically sync existing local resume history & Kanban jobs to cloud database.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
          >
            {loading ? (
              <span>Connecting to database...</span>
            ) : mode === "login" ? (
              <span>Sign In & Sync ☁️</span>
            ) : (
              <span>Create Account 🚀</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

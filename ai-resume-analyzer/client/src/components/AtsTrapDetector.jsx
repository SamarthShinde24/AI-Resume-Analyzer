import { useState } from "react";

export default function AtsTrapDetector({ trapsData, onToast }) {
  const [filter, setFilter] = useState("all");

  if (!trapsData) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500">
        No ATS parseability data available. Please re-run analysis.
      </div>
    );
  }

  const {
    ats_health_score = 75,
    traps = [],
    section_check = [],
    pronoun_audit = { count: 0, items: [] },
    buzzword_audit = { count: 0, items: [] },
    contact_check = {},
  } = trapsData;

  const filteredTraps = traps.filter((t) => {
    if (filter === "all") return true;
    return t.severity === filter;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "critical":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "info":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "passed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getSeverityIcon = (sev) => {
    switch (sev) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      case "passed":
        return "✅";
      default:
        return "📌";
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    if (onToast) onToast(`Copied ${label} to clipboard!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Health Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ATS Architecture Diagnostics
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Parseability & "Red Flag" Detector
            </h2>
            <p className="text-xs text-slate-500 pt-1">
              Evaluates header nomenclature, pronoun tone, contact integrity, and parser table safety.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200/80">
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900 font-mono">
                {ats_health_score}
                <span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Parseability Score
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-200" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-800">
                {traps.filter((t) => t.severity === "critical").length} Critical Traps
              </div>
              <div className="text-slate-500 text-[11px]">
                {traps.filter((t) => t.severity === "warning").length} Warnings to optimize
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400">Standard Sections</span>
            <div className="text-base font-extrabold text-slate-800 mt-0.5">
              {section_check.filter((s) => s.detected).length} / {section_check.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {section_check.filter((s) => s.required && !s.detected).length === 0
                ? "All required present"
                : "Missing essential headers"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400">Pronoun Count</span>
            <div className="text-base font-extrabold text-slate-800 mt-0.5">
              {pronoun_audit.count} found
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {pronoun_audit.count <= 2 ? "Active telegraphic style" : "Overuse of 'I' / 'my'"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400">Passive Clichés</span>
            <div className="text-base font-extrabold text-slate-800 mt-0.5">
              {buzzword_audit.count} buzzwords
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {buzzword_audit.count === 0 ? "Strong action verbs" : "Needs metric replacements"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase text-slate-400">Contact Gateway</span>
            <div className="text-base font-extrabold text-slate-800 mt-0.5">
              {contact_check.has_email && contact_check.has_phone ? "Complete" : "Incomplete"}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {contact_check.has_email ? "Email detected" : "Missing Email"}
            </p>
          </div>
        </div>

        {/* Section Headers Checklist */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            Standard Header Recognition
          </h3>
          <div className="flex flex-wrap gap-2">
            {section_check.map((sec) => (
              <span
                key={sec.key}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border ${
                  sec.detected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : sec.required
                    ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                <span>{sec.detected ? "✓" : sec.required ? "✕" : "○"}</span>
                <span>{sec.label}</span>
                {sec.required && (
                  <span className="text-[9px] uppercase px-1 rounded bg-black/5 font-semibold">
                    Req
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Traps & Red Flags Filter and List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Identified Rejection Traps & Recommendations
              </h3>
              <p className="text-xs text-slate-500">
                Fixing these ensures automated ATS parsers don't silently drop your application.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {["all", "critical", "warning", "info", "passed"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition cursor-pointer ${
                  filter === tab
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {filteredTraps.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No items matching filter "{filter}".
            </div>
          ) : (
            filteredTraps.map((trap, idx) => (
              <div
                key={trap.id || idx}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getSeverityIcon(trap.severity)}</span>
                    <span className="text-xs font-bold text-slate-900">{trap.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                      {trap.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getSeverityBadge(
                        trap.severity
                      )}`}
                    >
                      {trap.severity}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{trap.detail}</p>

                {trap.recommendation && (
                  <div className="p-3 rounded-xl bg-white border border-indigo-100 flex items-start justify-between gap-3">
                    <div className="text-xs text-indigo-950">
                      <strong className="text-indigo-600">Action: </strong>
                      {trap.recommendation}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(trap.recommendation, "recommendation")}
                      className="shrink-0 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded bg-indigo-50 border border-indigo-200 transition cursor-pointer"
                    >
                      Copy Fix
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

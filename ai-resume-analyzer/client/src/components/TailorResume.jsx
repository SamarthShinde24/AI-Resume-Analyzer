import { useState } from "react";
import { tailorResume } from "../api.js";

export default function TailorResume({ file, jobDescription, resumeText, onToast }) {
  const [loading, setLoading] = useState(false);
  const [tailoredData, setTailoredData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tailorResume({ file, jobDescription, resumeText });
      setTailoredData(data);
    } catch (err) {
      setError(err.message || "Failed to generate tailored resume content.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, key, label = "Content") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (onToast) {
      onToast(`${label} copied to clipboard!`);
    }
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <h2 className="text-lg font-bold text-gray-900">Tailor My Resume for this Role</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-generate JD-tailored professional headline, executive summary, and quantified bullets
          </p>
        </div>

        {!tailoredData && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || (!file && !resumeText) || !jobDescription}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Optimizing Content...
              </span>
            ) : (
              "Generate Tailored Content"
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      {tailoredData && (
        <div className="space-y-6">
          {/* Strategy Callout */}
          {tailoredData.tailoring_strategy && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Strategic ATS Positioning
              </span>
              <p className="text-xs mt-1 leading-relaxed text-indigo-950 font-medium">
                {tailoredData.tailoring_strategy}
              </p>
            </div>
          )}

          {/* ATS Headline */}
          {tailoredData.ats_headline && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Targeted ATS Headline
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(tailoredData.ats_headline, "headline")}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
                >
                  {copiedKey === "headline" ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p className="text-base font-bold text-gray-900">{tailoredData.ats_headline}</p>
            </div>
          )}

          {/* Tailored Professional Summary */}
          {tailoredData.tailored_summary && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Tailored Professional Summary
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(tailoredData.tailored_summary, "summary")}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
                >
                  {copiedKey === "summary" ? "✓ Copied" : "Copy Summary"}
                </button>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed font-normal">
                {tailoredData.tailored_summary}
              </p>
            </div>
          )}

          {/* Prioritized Core Competencies */}
          {tailoredData.core_competencies?.length > 0 && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Key Competencies to Feature
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(tailoredData.core_competencies.join(", "), "skills")
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
                >
                  {copiedKey === "skills" ? "✓ Copied" : "Copy All Skills"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tailoredData.core_competencies.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium bg-white text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tailored Experience Bullets */}
          {tailoredData.tailored_bullets?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Targeted Experience Bullets
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      tailoredData.tailored_bullets.map((b) => `• ${b.tailored_bullet}`).join("\n"),
                      "all_bullets"
                    )
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
                >
                  {copiedKey === "all_bullets" ? "✓ Copied All" : "Copy All Bullets"}
                </button>
              </div>

              {tailoredData.tailored_bullets.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 transition space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {item.context}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.tailored_bullet, `bullet-${idx}`)}
                      className="text-xs text-gray-500 hover:text-indigo-600 font-medium transition"
                    >
                      {copiedKey === `bullet-${idx}` ? "✓ Copied" : "Copy Bullet"}
                    </button>
                  </div>
                  {item.original_focus && (
                    <p className="text-xs text-gray-400 italic">
                      Original focus: {item.original_focus}
                    </p>
                  )}
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    {item.tailored_bullet}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="text-xs font-semibold text-gray-500 hover:text-indigo-600 transition"
            >
              {loading ? "Regenerating..." : "↻ Regenerate with different phrasing"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

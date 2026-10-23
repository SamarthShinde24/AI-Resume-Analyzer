import { useState } from "react";

export default function BulletRewrites({ bullets, onToast }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!bullets?.length) return null;

  const copyRewrite = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    if (onToast) {
      onToast("Optimized rewrite copied to clipboard!");
    }
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllRewrites = () => {
    const allText = bullets.map((b) => `• ${b.rewrite}`).join("\n\n");
    navigator.clipboard.writeText(allText);
    if (onToast) {
      onToast("All suggested rewrites copied to clipboard!");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
            Quantified Action Verb Engine
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">
            Targeted Bullet Point Rewrites
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Weak responsibilities transformed into metric-driven achievements
          </p>
        </div>

        <button
          type="button"
          onClick={copyAllRewrites}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer self-start sm:self-auto"
        >
          <span>📋 Copy All Rewrites</span>
        </button>
      </div>

      <div className="space-y-4">
        {bullets.map((b, i) => (
          <div
            key={i}
            className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/50 space-y-3 hover:border-indigo-200 transition"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                Original Weak Phrasing
              </span>
              <p className="text-xs text-slate-500 line-through mt-1.5 italic font-mono">
                {b.original}
              </p>
            </div>

            <div className="text-xs text-amber-900 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3.5 py-2 font-medium flex items-start gap-2">
              <span className="font-bold text-amber-700">Issue:</span>
              <span>{b.issue}</span>
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Recruiter-Optimized Bullet
                </span>
                <button
                  type="button"
                  onClick={() => copyRewrite(b.rewrite, i)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedIndex === i ? (
                    <span className="text-emerald-600">✓ Copied</span>
                  ) : (
                    <span>Copy Bullet</span>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                  {b.rewrite}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

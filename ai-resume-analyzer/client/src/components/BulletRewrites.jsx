import { useState } from "react";

export default function BulletRewrites({ bullets }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!bullets?.length) return null;

  const copyRewrite = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">High-Impact Bullet Point Rewrites</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Weak phrasing transformed into quantified, action-driven achievements
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {bullets.map((b, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                Original Bullet
              </span>
              <p className="text-xs text-gray-500 line-through mt-1 italic">{b.original}</p>
            </div>

            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200/70 rounded-lg px-3 py-1.5 font-medium">
              <span className="font-semibold">Issue:</span> {b.issue}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Optimized Rewrite
                </span>
                <button
                  type="button"
                  onClick={() => copyRewrite(b.rewrite, i)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition cursor-pointer"
                >
                  {copiedIndex === i ? "✓ Copied" : "Copy Rewrite"}
                </button>
              </div>
              <p className="text-sm text-gray-900 font-medium leading-relaxed bg-white border border-gray-200 rounded-lg p-3 shadow-2xs">
                {b.rewrite}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

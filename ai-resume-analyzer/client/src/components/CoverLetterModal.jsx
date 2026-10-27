import { useState } from "react";
import { generateCoverLetter } from "../api.js";

export default function CoverLetterModal({ isOpen, onClose, file, jobDescription, onToast }) {
  const [letterData, setLetterData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateCoverLetter({ file, jobDescription });
      setLetterData(data);
      if (onToast) onToast("Tailored cover letter generated!");
    } catch (err) {
      setError(err.message || "Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!letterData?.full_letter) return;
    navigator.clipboard.writeText(letterData.full_letter);
    if (onToast) onToast("Cover letter copied to clipboard!");
  };

  const handleDownload = () => {
    if (!letterData?.full_letter) return;
    const blob = new Blob([letterData.full_letter], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanRole = (letterData.target_role || "cover-letter").toLowerCase().replace(/[^a-z0-9]/g, "-");
    a.download = `${cleanRole}-cover-letter.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onToast) onToast("Cover letter downloaded as Markdown!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-xs">
              ✉️
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Tailored Cover Letter Generator
              </h3>
              <p className="text-xs text-slate-500">
                High-converting 3-paragraph executive cover letter matched to this JD.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {!letterData && !loading && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl">
                ✍️
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Generate Your Tailored Cover Letter
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our AI connects your proven career achievements directly to the role's primary pain points,
                  generating a compelling hook, quantifiable evidence, and confident close.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer shadow-sm"
              >
                Generate Cover Letter Now
              </button>
            </div>
          )}

          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-600">
                Crafting targeted 3-paragraph cover letter...
              </p>
            </div>
          )}

          {letterData && (
            <div className="space-y-4">
              {/* Strategic positioning banner */}
              {letterData.tone_strategy && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 flex items-center gap-2">
                  <span className="font-bold text-indigo-600">Strategy:</span>
                  <span>{letterData.tone_strategy}</span>
                </div>
              )}

              {/* Subject Line Pill */}
              {letterData.subject_line && (
                <div className="flex items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-500 shrink-0">Subject:</span>
                  <span className="font-mono text-slate-800 font-semibold truncate">
                    {letterData.subject_line}
                  </span>
                </div>
              )}

              {/* Formatted Letter Document */}
              <div className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200 font-serif text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text">
                {letterData.full_letter}
              </div>

              {/* Highlight Bullets */}
              {letterData.highlight_bullets?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Core Alignment Highlights
                  </span>
                  <div className="space-y-1">
                    {letterData.highlight_bullets.map((b, i) => (
                      <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="text-indigo-600 font-bold shrink-0">✦</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          {letterData ? (
            <>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition cursor-pointer"
              >
                Regenerate
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition cursor-pointer"
                >
                  Download .md
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                >
                  Copy Letter
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-1.5 rounded-lg border border-slate-200 bg-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { downloadTailoredDocx } from "../api.js";

/**
 * Client-side helper to substitute weak bullets with AI rewrites in text.
 */
function substituteBulletsInText(text, weakBullets = []) {
  if (!text || !Array.isArray(weakBullets) || weakBullets.length === 0) {
    return { text: text || "", count: 0 };
  }

  let updated = text;
  let count = 0;

  for (const item of weakBullets) {
    if (!item.original || !item.rewrite) continue;
    const cleanOrig = item.original.replace(/^[\s•*\-\d.)]+/, "").trim();
    const cleanRewr = item.rewrite.replace(/^[\s•*\-\d.)]+/, "").trim();

    if (!cleanOrig || !cleanRewr) continue;

    if (updated.includes(item.original)) {
      updated = updated.replace(item.original, item.rewrite);
      count++;
    } else if (updated.includes(cleanOrig)) {
      updated = updated.replace(cleanOrig, cleanRewr);
      count++;
    } else {
      const sample = cleanOrig.slice(0, 35);
      const lines = updated.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(sample)) {
          const matchPrefix = lines[i].match(/^(\s*[•*\-]?\s*)/);
          const prefix = matchPrefix ? matchPrefix[1] : "• ";
          lines[i] = `${prefix}${cleanRewr}`;
          count++;
          break;
        }
      }
      updated = lines.join("\n");
    }
  }

  return { text: updated, count };
}

export default function TailoredResumeExportModal({
  isOpen,
  onClose,
  resumeText,
  weakBullets = [],
  candidateName = "Candidate",
  onToast,
}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("preview"); // "preview" | "diff"

  const { text: tailoredText, count: replacedCount } = useMemo(() => {
    return substituteBulletsInText(resumeText, weakBullets);
  }, [resumeText, weakBullets]);

  if (!isOpen) return null;

  const handleDownloadDocx = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadTailoredDocx({
        resumeText,
        weakBullets,
        candidateName,
        autoApplyRewrites: true,
      });
      if (onToast) onToast("Tailored Word (.docx) document downloaded!");
    } catch (err) {
      setError(err.message || "Failed to download Word document.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      if (onToast) onToast("Popup blocked. Please allow popups to print/save PDF.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${candidateName} - Tailored Resume</title>
          <style>
            @page { margin: 0.8in; size: letter; }
            body {
              font-family: 'Calibri', 'Arial', sans-serif;
              color: #1e293b;
              line-height: 1.45;
              font-size: 10.5pt;
              margin: 0;
              padding: 20px;
            }
            h1 { font-size: 20pt; margin: 0 0 6px 0; text-align: center; color: #0f172a; }
            .contact { text-align: center; font-size: 9.5pt; color: #64748b; margin-bottom: 18px; }
            pre {
              font-family: inherit;
              white-space: pre-wrap;
              word-wrap: break-word;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <pre>${tailoredText}</pre>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    if (onToast) onToast("Opened print preview (select 'Save as PDF')");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(tailoredText);
    if (onToast) onToast("Tailored resume copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xs">
              📄
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Download Tailored Resume (.docx / .pdf)
              </h3>
              <p className="text-xs text-slate-500">
                Full resume with all weak bullets automatically upgraded with quantified AI rewrites.
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

        {/* Upgrade Stat Banner */}
        <div className="px-6 py-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong>{replacedCount} Weak Bullets</strong> automatically upgraded with action verbs & metrics.
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveView("preview")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                activeView === "preview"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Document Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveView("diff")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                activeView === "diff"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Rewrites Diff ({weakBullets.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {activeView === "preview" ? (
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6 font-mono text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed select-text max-h-[48vh] overflow-y-auto">
              {tailoredText}
            </div>
          ) : (
            <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
              {weakBullets.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  No weak bullets were identified in this resume.
                </p>
              ) : (
                weakBullets.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase text-rose-600 block mb-0.5">
                        Original Phrasing:
                      </span>
                      <p className="line-through text-slate-500">{b.original}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-0.5">
                        Tailored AI Rewrite (Included in Export):
                      </span>
                      <p className="font-semibold text-emerald-900 bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                        {b.rewrite}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Export formats: <strong>Word (.docx)</strong> or <strong>Print / Save as PDF</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyText}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition cursor-pointer"
            >
              📋 Copy Text
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={downloading}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition cursor-pointer shadow-sm flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating .docx...</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>Download .docx</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

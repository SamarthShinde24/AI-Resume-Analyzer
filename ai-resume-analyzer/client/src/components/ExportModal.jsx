import { useState, useMemo } from "react";
import { generateMarkdownReport, downloadFile } from "../utils/reportGenerator.js";
import { downloadAuditSheetPdf } from "../api.js";

export default function ExportModal({ isOpen, onClose, result, meta = {}, onToast }) {
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const markdownContent = useMemo(() => {
    if (!result) return "";
    return generateMarkdownReport(result, meta);
  }, [result, meta]);

  if (!isOpen || !result) return null;

  const safeRoleName = (meta.roleTitle || "Target-Role")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 30);
  const fileName = `ATS_Audit_Report_${safeRoleName}_${new Date().toISOString().slice(0, 10)}.md`;

  const handleDownloadMarkdown = () => {
    downloadFile(markdownContent, fileName);
    if (onToast) onToast("Markdown audit report downloaded!");
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadAuditSheetPdf({ result, meta });
      if (onToast) onToast("Native PDF Audit Sheet downloaded successfully!");
    } catch (err) {
      if (onToast) onToast(err.message || "Failed to download PDF audit report.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    if (onToast) onToast("Markdown report copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPDF = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in print:hidden">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Export Audit Sheet
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              Download Interview-Prep Report
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Save your complete ATS evaluation, keyword gaps, and bullet rewrites
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 border-b border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="p-3.5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50 hover:shadow-xs transition text-left space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">📑</span>
              <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full transition">
                Direct .PDF
              </span>
            </div>
            <h4 className="text-xs font-bold text-indigo-950">Download PDF</h4>
            <p className="text-[10.5px] text-indigo-700/80 leading-relaxed">
              1-click native PDF audit sheet generated directly by server.
            </p>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition text-left space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">📄</span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-slate-900 group-hover:text-white transition">
                .MD Format
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Download Markdown</h4>
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              Ideal for Notion, GitHub, Obsidian, or local prep notes.
            </p>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition text-left space-y-1.5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🖨️</span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-slate-900 group-hover:text-white transition">
                Print Dialog
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Browser Print</h4>
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              Clean formatted browser sheet for physical printing.
            </p>
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="p-6 flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Report Preview
            </span>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              {copied ? "✓ Copied" : "Copy Markdown"}
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-52 whitespace-pre-wrap select-all">
            {markdownContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Powered by server-side binary PDF generator (pdfkit)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {downloadingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <span>📑</span>
                  <span>Download PDF Audit Sheet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

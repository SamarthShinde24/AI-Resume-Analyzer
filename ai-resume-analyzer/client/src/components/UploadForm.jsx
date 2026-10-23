import { useState, useRef } from "react";
import { SAMPLE_PRESETS } from "../data/samplePresets.js";

export default function UploadForm({ onSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const getFileBadgeStyle = (fileName) => {
    const ext = fileName?.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "bg-rose-100 text-rose-700 border-rose-200";
    if (ext === "docx" || ext === "doc") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const validateAndSetFile = (selectedFile) => {
    setFileError(null);
    if (!selectedFile) return;

    const validExtensions = [".pdf", ".docx", ".doc", ".txt"];
    const ext = "." + (selectedFile.name.split(".").pop() || "").toLowerCase();

    if (!validExtensions.includes(ext)) {
      setFileError("Invalid file type. Please upload a PDF, DOCX, or TXT resume.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError("File exceeds 5MB size limit. Please upload a smaller document.");
      return;
    }

    setFile(selectedFile);
  };

  const handleSelectPreset = (preset) => {
    const sampleFile = new File([preset.resumeText], preset.fileName, {
      type: "text/plain",
    });
    setFile(sampleFile);
    setJobDescription(preset.jobDescription);
    setFileError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || jobDescription.trim().length < 20) return;
    onSubmit(file, jobDescription);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {/* Sample Presets Quick Demo Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 rounded-full bg-amber-100 items-center justify-center text-amber-600 text-xs font-bold">
            ⚡
          </span>
          <div>
            <p className="text-xs font-bold text-slate-800">Quick Demo Presets</p>
            <p className="text-[11px] text-slate-500">Test immediately without searching for files</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 transition cursor-pointer"
            >
              <span>{preset.title}</span>
              <span className="text-[10px] text-indigo-500 bg-white px-1.5 py-0.5 rounded-md font-medium shadow-2xs">
                {preset.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Resume Upload Dropzone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Resume Document
          </label>
          <span className="text-xs text-slate-400">PDF, DOCX, TXT (Max 5MB)</span>
        </div>

        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-indigo-600 bg-indigo-50/70 scale-[1.01]"
                : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60 bg-white"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={(e) => validateAndSetFile(e.target.files[0] || null)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 transition ${
                  isDragging ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
                }`}
              >
                📄
              </div>
              <p className="text-sm font-bold text-slate-800">
                {isDragging ? "Drop your resume file here!" : "Click to upload or drag & drop"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Drag a file here or browse from your computer
              </p>

              <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold">.PDF</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold">.DOCX</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold">.TXT</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-white border border-indigo-200 rounded-2xl shadow-xs transition">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center font-extrabold text-xs uppercase shadow-2xs ${getFileBadgeStyle(
                  file.name
                )}`}
              >
                {file.name.split(".").pop()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(file.size)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              >
                Remove
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => validateAndSetFile(e.target.files[0] || null)}
                className="hidden"
              />
            </div>
          </div>
        )}

        {fileError && (
          <p className="text-xs font-medium text-rose-600 mt-2 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{fileError}</span>
          </p>
        )}
      </div>

      {/* Job Description Textarea */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Target Job Description
          </label>
          <div className="flex items-center gap-3">
            {jobDescription && (
              <button
                type="button"
                onClick={() => setJobDescription("")}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition"
              >
                Clear text
              </button>
            )}
            <span
              className={`text-xs font-medium ${
                jobDescription.trim().length >= 20 ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {jobDescription.trim().length} chars (min 20)
            </span>
          </div>
        </div>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={7}
          placeholder="Paste the target job description here (responsibilities, required qualifications, key technologies)..."
          className="block w-full text-sm border border-slate-300 rounded-2xl p-4 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-2xs resize-y"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !file || jobDescription.trim().length < 20}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
      >
        <span>Run Comprehensive ATS Audit</span>
        <span>→</span>
      </button>
    </form>
  );
}

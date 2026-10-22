import { useState, useRef } from "react";

export default function UploadForm({ onSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || jobDescription.trim().length < 20) return;
    onSubmit(file, jobDescription);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {/* Resume Upload Dropzone */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
          Resume Document (PDF, DOCX, or TXT)
        </label>

        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              isDragging
                ? "border-indigo-500 bg-indigo-50/50"
                : "border-gray-300 hover:border-indigo-400 bg-white"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 text-xl">
                📄
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Click to browse or drag and drop your resume
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supports PDF, Microsoft Word (.docx), and plain text (up to 5MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-white border border-indigo-200 rounded-xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                {file.name.split(".").pop()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Job Description Textarea */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
            Target Job Description
          </label>
          <span className="text-xs text-gray-400 font-medium">
            {jobDescription.trim().length} characters (min 20)
          </span>
        </div>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={7}
          placeholder="Paste the complete job description, responsibilities, and required qualifications here..."
          className="block w-full text-sm border border-gray-300 rounded-xl p-4 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-2xs resize-y"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !file || jobDescription.trim().length < 20}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Analyzing Resume against JD...</span>
          </>
        ) : (
          <span>Run Comprehensive ATS Audit</span>
        )}
      </button>
    </form>
  );
}

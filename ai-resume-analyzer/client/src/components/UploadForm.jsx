import { useState } from "react";

export default function UploadForm({ onSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || jobDescription.trim().length < 20) return;
    onSubmit(file, jobDescription);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      <div>
        <label className="block text-sm font-medium mb-1">
          Resume (PDF or .txt)
        </label>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm border rounded-lg p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Job Description
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={8}
          placeholder="Paste the full job description here..."
          className="block w-full text-sm border rounded-lg p-3"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !file || jobDescription.trim().length < 20}
        className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
      >
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>
    </form>
  );
}

import { useState } from "react";
import UploadForm from "./components/UploadForm.jsx";
import ScoreCard from "./components/ScoreCard.jsx";
import SkillGaps from "./components/SkillGaps.jsx";
import BulletRewrites from "./components/BulletRewrites.jsx";
import { analyzeResume } from "./api.js";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (file, jobDescription) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeResume(file, jobDescription);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <h1 className="text-2xl font-bold text-center mb-1">AI Resume Analyzer</h1>
      <p className="text-center text-gray-500 mb-8">
        Upload your resume and a job description to get an instant match score.
      </p>

      <UploadForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <p className="max-w-2xl mx-auto text-center text-red-600 mt-4">{error}</p>
      )}

      {result && (
        <div className="max-w-2xl mx-auto mt-8 space-y-6">
          <ScoreCard score={result.match_score} summary={result.summary} />
          <SkillGaps
            matched={result.matched_skills}
            missing={result.missing_skills}
          />
          <BulletRewrites bullets={result.weak_bullets} />
        </div>
      )}
    </div>
  );
}

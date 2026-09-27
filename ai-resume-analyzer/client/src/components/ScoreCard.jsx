export default function ScoreCard({ score, summary }) {
  const color =
    score >= 75 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="border rounded-xl p-6 text-center bg-white shadow-sm">
      <div className={`text-5xl font-bold ${color}`}>{score}</div>
      <div className="text-sm text-gray-500 mb-3">Match Score / 100</div>
      <p className="text-gray-700">{summary}</p>
    </div>
  );
}

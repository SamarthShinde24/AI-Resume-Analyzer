export default function BulletRewrites({ bullets }) {
  if (!bullets?.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Suggested Rewrites</h3>
      {bullets.map((b, i) => (
        <div key={i} className="border rounded-xl p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500 line-through mb-1">{b.original}</p>
          <p className="text-xs text-amber-600 mb-2">Issue: {b.issue}</p>
          <p className="text-sm text-gray-900 font-medium">{b.rewrite}</p>
        </div>
      ))}
    </div>
  );
}

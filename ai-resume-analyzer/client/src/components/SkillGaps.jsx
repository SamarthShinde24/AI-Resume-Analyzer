export default function SkillGaps({ matched, missing }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="border rounded-xl p-4 bg-white shadow-sm">
        <h3 className="font-semibold text-green-700 mb-2">Matched Skills</h3>
        <div className="flex flex-wrap gap-2">
          {matched.map((skill, i) => (
            <span
              key={i}
              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="border rounded-xl p-4 bg-white shadow-sm">
        <h3 className="font-semibold text-red-700 mb-2">Missing Skills</h3>
        <div className="flex flex-wrap gap-2">
          {missing.map((skill, i) => (
            <span
              key={i}
              className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

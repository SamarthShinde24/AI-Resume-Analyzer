import { useState } from "react";

export default function SkillGaps({ matched = [], missing = [], checklist = [] }) {
  const [filter, setFilter] = useState("all");
  const [addressedSkills, setAddressedSkills] = useState({});

  // Consolidate checklist items
  const items = checklist.length > 0
    ? checklist
    : [
        ...missing.map((s) => ({
          skill: s,
          type: "required",
          status: "missing",
          tip: `Incorporate ${s} into your technical skills summary or project descriptions.`,
        })),
        ...matched.map((s) => ({
          skill: s,
          type: "required",
          status: "matched",
          tip: "Clearly identified in your resume. Keep this prominent.",
        })),
      ];

  const toggleAddressed = (skillName) => {
    setAddressedSkills((prev) => ({
      ...prev,
      [skillName]: !prev[skillName],
    }));
  };

  const missingItems = items.filter((item) => item.status === "missing");
  const matchedItems = items.filter((item) => item.status === "matched");

  const requiredMissing = missingItems.filter((item) => item.type === "required");
  const niceToHaveMissing = missingItems.filter((item) => item.type === "nice_to_have");

  const addressedCount = missingItems.filter((item) => addressedSkills[item.skill]).length;

  const filteredItems = items.filter((item) => {
    if (filter === "required_missing") return item.status === "missing" && item.type === "required";
    if (filter === "nice_missing") return item.status === "missing" && item.type === "nice_to_have";
    if (filter === "matched") return item.status === "matched";
    return true;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Keyword & Skills Gap Analysis</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Target keywords extracted directly from the job description
          </p>
        </div>

        {missingItems.length > 0 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            {addressedCount} of {missingItems.length} missing addressed
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filter === "all"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("required_missing")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filter === "required_missing"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
          }`}
        >
          Required Gaps ({requiredMissing.length})
        </button>
        {niceToHaveMissing.length > 0 && (
          <button
            type="button"
            onClick={() => setFilter("nice_missing")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filter === "nice_missing"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            Nice-to-Have Gaps ({niceToHaveMissing.length})
          </button>
        )}
        <button
          type="button"
          onClick={() => setFilter("matched")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filter === "matched"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
          }`}
        >
          Matched ({matchedItems.length})
        </button>
      </div>

      {/* Interactive Keyword Checklist Cards */}
      <div className="space-y-3">
        {filteredItems.map((item, idx) => {
          const isMissing = item.status === "missing";
          const isAddressed = Boolean(addressedSkills[item.skill]);
          const isRequired = item.type === "required";

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                isMissing
                  ? isAddressed
                    ? "bg-gray-50 border-gray-200 opacity-60"
                    : isRequired
                    ? "bg-rose-50/40 border-rose-200"
                    : "bg-amber-50/40 border-amber-200"
                  : "bg-emerald-50/30 border-emerald-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {isMissing ? (
                    <input
                      type="checkbox"
                      id={`chk-${idx}`}
                      checked={isAddressed}
                      onChange={() => toggleAddressed(item.skill)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  ) : (
                    <span className="mt-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      ✓
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          isAddressed ? "line-through text-gray-500" : "text-gray-900"
                        }`}
                      >
                        {item.skill}
                      </span>

                      {isMissing ? (
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isRequired
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isRequired ? "Required" : "Nice-to-Have"}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Matched
                        </span>
                      )}
                    </div>

                    {item.tip && (
                      <p className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                        <span className="font-semibold text-gray-700">Tip:</span>
                        <span>{item.tip}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-6">
            No keywords found in this filter category.
          </p>
        )}
      </div>
    </div>
  );
}

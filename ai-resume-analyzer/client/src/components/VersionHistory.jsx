import { useState } from "react";
import { deleteVersion, clearHistory } from "../services/historyService.js";

export default function VersionHistory({
  isOpen,
  onClose,
  history = [],
  onSelectVersion,
  onCompareVersions,
  onHistoryChange,
  onToast,
}) {
  const [selectedIds, setSelectedIds] = useState([]);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        // Keep max 2 selected for comparison
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const updated = deleteVersion(id);
    onHistoryChange(updated);
    setSelectedIds((prev) => prev.filter((item) => item !== id));
    if (onToast) onToast("Version removed from history");
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all resume version history?")) {
      const updated = clearHistory();
      onHistoryChange(updated);
      setSelectedIds([]);
      if (onToast) onToast("All resume version history cleared");
    }
  };

  const handleCompareClick = () => {
    if (selectedIds.length === 2) {
      const itemA = history.find((h) => h.id === selectedIds[0]);
      const itemB = history.find((h) => h.id === selectedIds[1]);
      // Order older first, newer second
      const [vOld, vNew] = itemA.version < itemB.version ? [itemA, itemB] : [itemB, itemA];
      onCompareVersions(vOld, vNew);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in print:hidden">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h3 className="text-lg font-extrabold text-slate-900">Resume Version History</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track score progression across revisions and compare iterations
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

        {/* Action Toolbar */}
        {history.length > 0 && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              {history.length} {history.length === 1 ? "version" : "versions"} saved
            </span>

            <div className="flex items-center gap-2">
              {history.length >= 2 && (
                <button
                  type="button"
                  onClick={handleCompareClick}
                  disabled={selectedIds.length !== 2}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                >
                  Compare ({selectedIds.length}/2)
                </button>
              )}

              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-rose-600 font-semibold transition cursor-pointer"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* History Cards List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {history.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <span className="text-4xl text-slate-300">📊</span>
              <p className="text-sm font-bold text-slate-700">No versions saved yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Run an ATS analysis to automatically record your first version snapshot.
              </p>
            </div>
          ) : (
            history.map((item, idx) => {
              const isSelected = selectedIds.includes(item.id);
              const isGain = item.delta > 0;
              const isLoss = item.delta < 0;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectVersion(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {history.length >= 2 && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(item.id);
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white">
                            {item.versionLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                            {item.roleTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {item.fileName} • {item.formattedDate}
                        </p>
                      </div>
                    </div>

                    {/* Score & Delta Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-slate-900">{item.score}%</div>
                      {idx < history.length - 1 && item.delta !== 0 && (
                        <span
                          className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isGain
                              ? "text-emerald-700 bg-emerald-100"
                              : isLoss
                              ? "text-rose-700 bg-rose-100"
                              : "text-slate-500 bg-slate-100"
                          }`}
                        >
                          {isGain ? `+${item.delta}%` : `${item.delta}%`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sub-scores chips */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100">
                      Skills: <b>{item.score_breakdown?.skills_match ?? item.score}%</b>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100">
                      Exp: <b>{item.score_breakdown?.experience_fit ?? item.score}%</b>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100">
                      Impact: <b>{item.score_breakdown?.quantifiable_impact ?? item.score}%</b>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition"
                      title="Delete snapshot"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-[11px] text-slate-500">
            Click any version card to instantly restore that audit report snapshot.
          </p>
        </div>
      </div>
    </div>
  );
}

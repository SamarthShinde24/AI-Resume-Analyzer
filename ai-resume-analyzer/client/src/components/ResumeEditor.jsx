import { useState, useEffect, useRef, useMemo } from "react";
import { rescoreLive } from "../api.js";

/**
 * Client-side helper to substitute weak bullets with AI rewrites in text.
 */
function substituteBullets(text, weakBullets = []) {
  if (!text || !Array.isArray(weakBullets) || weakBullets.length === 0) {
    return { text: text || "", count: 0 };
  }

  let updated = text;
  let count = 0;

  for (const item of weakBullets) {
    if (!item.original || !item.rewrite) continue;
    const cleanOrig = item.original.replace(/^[\s•*\-\d.)]+/, "").trim();
    const cleanRewr = item.rewrite.replace(/^[\s•*\-\d.)]+/, "").trim();

    if (!cleanOrig || !cleanRewr) continue;

    if (updated.includes(item.original)) {
      updated = updated.replace(item.original, item.rewrite);
      count++;
    } else if (updated.includes(cleanOrig)) {
      updated = updated.replace(cleanOrig, cleanRewr);
      count++;
    } else {
      const sample = cleanOrig.slice(0, 35);
      const lines = updated.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(sample)) {
          const matchPrefix = lines[i].match(/^(\s*[•*\-]?\s*)/);
          const prefix = matchPrefix ? matchPrefix[1] : "• ";
          lines[i] = `${prefix}${cleanRewr}`;
          count++;
          break;
        }
      }
      updated = lines.join("\n");
    }
  }

  return { text: updated, count };
}

export default function ResumeEditor({
  initialResumeText = "",
  jobDescription = "",
  checklist = [],
  weakBullets = [],
  baseScore = 65,
  onSaveVersion,
  onOpenDocxModal,
  onToast,
}) {
  const [text, setText] = useState(initialResumeText);
  const [liveScore, setLiveScore] = useState(baseScore);
  const [scoreDelta, setScoreDelta] = useState(0);
  const [liveChecklist, setLiveChecklist] = useState(checklist);
  const [newlyResolved, setNewlyResolved] = useState([]);
  const [keywordFilter, setKeywordFilter] = useState("all"); // "all" | "missing" | "matched"
  const [isRescoring, setIsRescoring] = useState(false);
  const [activeTab, setActiveTab] = useState("keywords"); // "keywords" | "traps"
  const textareaRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync if initialResumeText changes
  useEffect(() => {
    if (initialResumeText && !text) {
      setText(initialResumeText);
    }
  }, [initialResumeText]);

  // Instant 0ms local keyword matcher as user types
  const localMatchAnalysis = useMemo(() => {
    const lower = text.toLowerCase();
    const updated = [];
    const resolvedInSession = [];
    let matchedCount = 0;

    for (const item of checklist) {
      if (!item?.skill) continue;
      const skillLower = item.skill.toLowerCase().trim();
      const escaped = skillLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const isPresent =
        new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(lower) ||
        lower.includes(skillLower);

      const wasOriginallyMissing = item.status === "missing";
      if (isPresent && wasOriginallyMissing) {
        resolvedInSession.push(item.skill);
      }

      if (isPresent) matchedCount++;

      updated.push({
        ...item,
        status: isPresent ? "matched" : "missing",
        is_lit_up: isPresent && wasOriginallyMissing,
      });
    }

    // Pronouns check in real-time
    const pronounMatches = text.match(/\b(I|me|my|myself|we|our|ours)\b/gi) || [];

    // Word & line counts
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split("\n").length;

    return {
      updatedChecklist: updated,
      resolvedInSession,
      matchedCount,
      totalCount: checklist.length,
      pronounCount: pronounMatches.length,
      wordCount: words,
      lineCount: lines,
    };
  }, [text, checklist]);

  // Debounced server re-scoring (300ms) for vector cosine & blended ATS metrics
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text || text.trim().length < 30) return;

    debounceTimerRef.current = setTimeout(async () => {
      setIsRescoring(true);
      try {
        const data = await rescoreLive({
          resumeText: text,
          jobDescription,
          originalChecklist: checklist,
          baseScore,
        });

        setLiveScore(data.live_score);
        setScoreDelta(data.score_delta);
        setLiveChecklist(data.checklist);
        setNewlyResolved(data.newly_resolved);
      } catch (err) {
        console.warn("Live re-score error:", err);
      } finally {
        setIsRescoring(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [text, jobDescription, checklist, baseScore]);

  // Handle applying all AI rewrites in 1 click
  const handleApplyRewrites = () => {
    const { text: newText, count } = substituteBullets(text, weakBullets);
    if (count === 0) {
      if (onToast) onToast("All AI rewrites are already applied!");
      return;
    }
    setText(newText);
    if (onToast) onToast(`Applied ${count} AI bullet rewrites directly into your resume!`);
  };

  // Handle resetting back to original
  const handleResetToOriginal = () => {
    setText(initialResumeText);
    setLiveScore(baseScore);
    setScoreDelta(0);
    setNewlyResolved([]);
    if (onToast) onToast("Reset resume editor back to original text.");
  };

  // Quick insert missing skill at cursor position
  const handleInsertSkill = (skill) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => `${prev}\n• Proficient in ${skill}`);
      return;
    }

    const start = textarea.selectionStart || text.length;
    const end = textarea.selectionEnd || text.length;
    const insertText = ` ${skill}`;

    const newText = text.slice(0, start) + insertText + text.slice(end);
    setText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 10);

    if (onToast) onToast(`Inserted "${skill}" at cursor!`);
  };

  const handleSaveSnapshot = () => {
    if (onSaveVersion) {
      onSaveVersion(text, liveScore);
    }
  };

  // Filter checklist for display
  const displayedChecklist = (
    liveChecklist.length > 0 ? liveChecklist : localMatchAnalysis.updatedChecklist
  ).filter((item) => {
    if (keywordFilter === "all") return true;
    return item.status === keywordFilter;
  });

  const getScoreColor = (score) => {
    if (score >= 75) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Strategy */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1.5">
              <span>⚡ Live ATS Re-Scoring Engine</span>
              <span className="text-indigo-300">•</span>
              <span>Instant Keyword Lighting</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              In-Browser Resume Editor
            </h2>
            <p className="text-xs text-slate-500 pt-1">
              Edit your resume text in the left pane and watch missing keywords light up green in real time as you type.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyRewrites}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚡ Apply All AI Rewrites ({weakBullets.length})</span>
            </button>
            <button
              type="button"
              onClick={handleResetToOriginal}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Live Score & Delta Gauge Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Live ATS Match Score
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-3xl font-black font-mono ${getScoreColor(liveScore)}`}>
                  {liveScore}%
                </span>
                {scoreDelta !== 0 && (
                  <span
                    className={`text-xs font-extrabold px-1.5 py-0.5 rounded-md ${
                      scoreDelta > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {scoreDelta > 0 ? `+${scoreDelta}%` : `${scoreDelta}%`}
                  </span>
                )}
              </div>
            </div>
            {isRescoring && (
              <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Keywords Matched
            </span>
            <div className="text-xl font-black text-slate-800 mt-1">
              {localMatchAnalysis.matchedCount} / {localMatchAnalysis.totalCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {localMatchAnalysis.totalCount - localMatchAnalysis.matchedCount} gaps remaining
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pronoun Health
            </span>
            <div className="text-xl font-black text-slate-800 mt-1">
              {localMatchAnalysis.pronounCount}
              <span className="text-xs font-normal text-slate-500 ml-1">pronouns</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {localMatchAnalysis.pronounCount <= 2 ? "Active voice compliant" : "Overuse of 'I' / 'my'"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Session Upgrades
            </span>
            <div className="text-xl font-black text-emerald-600 mt-1">
              +{localMatchAnalysis.resolvedInSession.length}
              <span className="text-xs font-normal text-slate-500 ml-1">resolved</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {localMatchAnalysis.resolvedInSession.length > 0
                ? "Lit up green in real-time!"
                : "Type missing keywords to boost"}
            </p>
          </div>
        </div>

        {/* Celebration banner for newly resolved keywords */}
        {localMatchAnalysis.resolvedInSession.length > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🎉</span>
              <span>
                <strong>{localMatchAnalysis.resolvedInSession.length} Keyword{localMatchAnalysis.resolvedInSession.length > 1 ? "s" : ""}</strong> newly resolved:{" "}
                <span className="font-semibold text-emerald-800">
                  {localMatchAnalysis.resolvedInSession.join(", ")}
                </span>
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
              ATS Score Boost Active
            </span>
          </div>
        )}
      </div>

      {/* Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Monospace Textarea Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Resume Content Source
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                ({localMatchAnalysis.lineCount} lines • {localMatchAnalysis.wordCount} words)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] text-slate-400">
                Click any keyword on the right to insert
              </span>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={22}
            placeholder="Type or edit your resume text directly..."
            className="w-full text-xs font-mono leading-relaxed p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-y text-slate-900"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-400">
              💡 Tip: Include action verbs and measurable metrics (e.g. <em>"Increased speed by 40%"</em>).
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveSnapshot}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
              >
                💾 Save Snapshot
              </button>
              {onOpenDocxModal && (
                <button
                  type="button"
                  onClick={onOpenDocxModal}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer"
                >
                  📄 Export .docx
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Keyword Lighting Dashboard (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Real-Time Keyword Gap Radar
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-[11px]">
              {["all", "missing", "matched"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setKeywordFilter(f)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition cursor-pointer ${
                    keywordFilter === f
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Keyword list with Real-Time Lighting Effect */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {displayedChecklist.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                No keywords matching filter "{keywordFilter}".
              </p>
            ) : (
              displayedChecklist.map((item, idx) => {
                const isMatched = item.status === "matched";
                const isLitUp = item.is_lit_up || item.newly_resolved;

                return (
                  <div
                    key={idx}
                    onClick={() => !isMatched && handleInsertSkill(item.skill)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                      isLitUp
                        ? "bg-emerald-50 border-emerald-400 shadow-sm animate-pulse"
                        : isMatched
                        ? "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70"
                        : "bg-slate-50/70 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isMatched
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {isMatched ? "✓" : "○"}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold truncate ${
                              isMatched ? "text-emerald-950 font-extrabold" : "text-slate-800"
                            }`}
                          >
                            {item.skill}
                          </span>
                          {isLitUp && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-emerald-600 text-white animate-bounce">
                              +Boost
                            </span>
                          )}
                        </div>
                        {item.tip && !isMatched && (
                          <p className="text-[10px] text-slate-400 truncate max-w-xs">
                            {item.tip}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          item.type === "required"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.type === "required" ? "Required" : "Nice-to-Have"}
                      </span>
                      {!isMatched && (
                        <span className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 underline">
                          +Insert
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            💡 Clicking <strong>+Insert</strong> automatically appends the keyword at your cursor in the editor.
          </div>
        </div>
      </div>
    </div>
  );
}

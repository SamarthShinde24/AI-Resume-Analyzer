export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-700 animate-slide-up">
      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
        ✓
      </div>
      <p className="text-xs font-semibold text-slate-100 pr-2">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-white text-xs font-bold transition p-1 cursor-pointer"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

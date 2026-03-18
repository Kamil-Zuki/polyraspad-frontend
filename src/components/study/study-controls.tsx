import React, { useEffect } from 'react';

interface StudyControlsProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  isRevealed: boolean;
  onReveal: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
  /** Intervals for each rating from FSRS (1=Again, 2=Hard, 3=Good, 4=Easy) */
  intervals?: Record<number, string>;
}

const DEFAULT_INTERVALS: Record<number, string> = {
  1: "1m",
  2: "2d",
  3: "4d",
  4: "14d",
};

export function StudyControls({
  onRate,
  isRevealed,
  onReveal,
  onUndo,
  canUndo = false,
  disabled,
  intervals = DEFAULT_INTERVALS,
}: StudyControlsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        if (isRevealed && canUndo && onUndo) onUndo();
        return;
      }
      if (!isRevealed) {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          onReveal();
        }
      } else {
        if (e.key === "1") { e.preventDefault(); onRate(1); }
        if (e.key === "2") { e.preventDefault(); onRate(2); }
        if (e.key === "3") { e.preventDefault(); onRate(3); }
        if (e.key === "4") { e.preventDefault(); onRate(4); }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, onRate, onReveal, onUndo, canUndo]);

  if (!isRevealed) {
    return (
      <footer className="h-32 flex flex-col items-center justify-center pb-8 z-20">
        <button 
          onClick={onReveal}
          disabled={disabled}
          className="px-12 py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-glow hover:brightness-110 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          Show Answer
        </button>
        <div className="mt-4 text-gray-600 text-[10px] uppercase tracking-widest">
          Press Space
        </div>
      </footer>
    );
  }

  return (
    <footer className="h-32 flex flex-col items-center justify-center pb-8 z-20">
      {/* SRS Actions */}
      <div className="grid grid-cols-4 gap-4 w-full max-w-2xl px-4">
        {/* Again */}
        <button 
          onClick={() => onRate(1)}
          disabled={disabled}
          className="bg-white/5 border border-white/5 hover:bg-status-again/10 hover:border-status-again/30 p-3 rounded-xl flex flex-col items-center group transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="text-xs font-bold text-gray-500 uppercase mb-1 group-hover:text-status-again transition">Again</span>
          <span className="text-lg font-bold text-status-again text-rose-400">{intervals[1] || "1m"}</span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Key: 1</span>
        </button>

        {/* Hard */}
        <button 
          onClick={() => onRate(2)}
          disabled={disabled}
          className="bg-white/5 border border-white/5 hover:bg-status-hard/10 hover:border-status-hard/30 p-3 rounded-xl flex flex-col items-center group transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="text-xs font-bold text-gray-500 uppercase mb-1 group-hover:text-status-hard transition">Hard</span>
          <span className="text-lg font-bold text-status-hard text-amber-400">{intervals[2] || "2d"}</span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Key: 2</span>
        </button>

        {/* Good - default choice, interval from FSRS when available */}
        <button
          onClick={() => onRate(3)}
          disabled={disabled}
          className="bg-brand-primary/10 border border-brand-primary/20 hover:bg-status-good/10 hover:border-status-good/30 p-3 rounded-xl flex flex-col items-center group transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="text-xs font-bold text-gray-500 uppercase mb-1 group-hover:text-status-good transition">Good</span>
          <span className="text-lg font-bold text-emerald-400">{intervals[3] || "4d"}</span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Key: 3</span>
        </button>

        {/* Easy */}
        <button 
          onClick={() => onRate(4)}
          disabled={disabled}
          className="bg-white/5 border border-white/5 hover:bg-status-easy/10 hover:border-status-easy/30 p-3 rounded-xl flex flex-col items-center group transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="text-xs font-bold text-gray-500 uppercase mb-1 group-hover:text-status-easy transition">Easy</span>
          <span className="text-lg font-bold text-status-easy text-cyan-400">{intervals[4] || "14d"}</span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Key: 4</span>
        </button>
      </div>

      {/* Undo - Anki style */}
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className="mt-4 text-gray-500 hover:text-white text-xs flex items-center gap-2 transition disabled:opacity-30 disabled:pointer-events-none"
        >
          <i className="fas fa-undo" /> Undo (Ctrl+Z)
        </button>
      )}
    </footer>
  );
}

import React, { useEffect } from 'react';

interface StudyControlsProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  isRevealed: boolean;
  onReveal: () => void;
}

export function StudyControls({ onRate, isRevealed, onReveal }: StudyControlsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRevealed) {
        if (e.code === 'Space' || e.code === 'Enter') {
          onReveal();
        }
      } else {
        if (e.key === '1') onRate(1);
        if (e.key === '2') onRate(2);
        if (e.key === '3') onRate(3);
        if (e.key === '4') onRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, onRate, onReveal]);

  if (!isRevealed) {
    return (
      <footer className="h-32 flex flex-col items-center justify-center pb-8 z-20">
        <button 
          onClick={onReveal}
          className="px-12 py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-glow hover:brightness-110 transition active:scale-95"
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
          className="bg-white/5 border border-white/5 hover:bg-status-again/10 hover:border-status-again/30 p-3 rounded-xl flex flex-col items-center group transition-all duration-200"
        >
          <span className="text-xs font-bold text-gray-500 uppercase mb-1 group-hover:text-status-again transition">Again</span>
          <span className="text-lg font-bold text-status-again text-rose-400">1m</span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Key: 1</span>
        </button>

        {/* Hard */}
        <button 
          onClick={() => onRate(2)}
          className="bg-white/5 border border-white/5 hover:bg-status-hard/10 hover:border-status-hard/30 p-3 rounded-xl flex flex-col items-center group transition-all duration-200"
        >
          <span className="text-xs font-bold text-gray-500 uppercase mb-1 group-hover:text-status-hard transition">Hard</span>
          <span className="text-lg font-bold text-status-hard text-amber-400">2d</span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Key: 2</span>
        </button>

        {/* Good */}
        <button 
          onClick={() => onRate(3)}
          className="bg-brand-primary/10 border border-brand-primary/20 hover:bg-status-good/10 hover:border-status-good/30 p-3 rounded-xl flex flex-col items-center group transition-all duration-200"
        >
          <span className="text-xs font-bold text-gray-500 uppercase mb-1 group-hover:text-status-good transition">Good</span>
          <span className="text-lg font-bold text-status-good text-emerald-400">5d</span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Key: 3</span>
        </button>

        {/* Easy */}
        <button 
          onClick={() => onRate(4)}
          className="bg-white/5 border border-white/5 hover:bg-status-easy/10 hover:border-status-easy/30 p-3 rounded-xl flex flex-col items-center group transition-all duration-200"
        >
          <span className="text-xs font-bold text-gray-500 uppercase mb-1 group-hover:text-status-easy transition">Easy</span>
          <span className="text-lg font-bold text-status-easy text-cyan-400">14d</span>
          <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-tighter">Key: 4</span>
        </button>
      </div>

      {/* Undo Action */}
      <button className="mt-4 text-gray-500 hover:text-white text-xs flex items-center gap-2 transition opacity-50 hover:opacity-100">
        <i className="fas fa-undo" /> Undo last action (Ctrl+Z)
      </button>
    </footer>
  );
}

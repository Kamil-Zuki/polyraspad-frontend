import React from "react";

export type SrsCardState = "NEW" | "LEARNING" | "REVIEW" | "MATURE";

interface StudyCardProps {
  sentence: string;
  targetWord: string;
  translation: string;
  note?: string;
  sourceType?: "youtube" | "book" | "article";
  sourceTitle?: string;
  sourceTimestamp?: string;
  /** FSRS/SRS state for Anki-style badge and interval hint */
  srsState?: { state: string; currentInterval: number };
  isRevealed: boolean;
  onReveal: () => void;
  userAnswer?: string;
  onAnswerChange?: (value: string) => void;
  onEnter?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const SRS_BADGE: Record<string, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-brand-primary/20 text-brand-primary border-brand-primary/40" },
  LEARNING: { label: "Learning", className: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  REVIEW: { label: "Review", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  MATURE: { label: "Review", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
};

export function StudyCard({
  sentence,
  targetWord,
  translation,
  note,
  sourceType,
  sourceTitle,
  sourceTimestamp,
  srsState,
  isRevealed,
  onReveal,
  userAnswer = "",
  onAnswerChange,
  onEnter,
  inputRef,
}: StudyCardProps) {
  const highlightedSentence = sentence.split(targetWord).reduce(
    (acc, part, i) => {
      if (i === 0) return [part];
      return [
        ...acc,
        <span key={i} className="text-brand-primary border-b-2 border-brand-primary/50 pb-0.5">
          {targetWord}
        </span>,
        part,
      ];
    },
    [] as (string | React.ReactNode)[]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnter) {
      onEnter();
    }
  };

  const badge = srsState ? SRS_BADGE[srsState.state] ?? SRS_BADGE.NEW : SRS_BADGE.NEW;

  return (
    <div
      onClick={!isRevealed ? onReveal : undefined}
      className={`w-full max-w-3xl min-h-[400px] rounded-3xl border border-white/10 bg-[rgba(19,25,39,0.8)] backdrop-blur-[20px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative ${
        !isRevealed ? "cursor-pointer hover:border-brand-primary/30 hover:bg-app-surface transition-colors" : ""
      }`}
    >
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span
          className={`px-2.5 py-1 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${badge.className}`}
        >
          {badge.label}
        </span>
        {srsState && (srsState.state === "REVIEW" || srsState.state === "MATURE") && srsState.currentInterval > 0 && (
          <span className="text-[10px] text-gray-500 font-mono">
            {srsState.currentInterval >= 365
              ? `${Math.round(srsState.currentInterval / 365)}y`
              : srsState.currentInterval >= 30
                ? `${Math.round(srsState.currentInterval / 30)}mo`
                : srsState.currentInterval >= 7
                  ? `${Math.round(srsState.currentInterval / 7)}w`
                  : `${srsState.currentInterval}d`}
          </span>
        )}
      </div>

      {sourceType && (
        <div className="absolute top-6 left-6 flex items-center gap-2 text-xs text-gray-500 hover:text-brand-primary transition">
          {sourceType === "youtube" && <i className="fab fa-youtube text-red-500" />}
          <span>{sourceTitle} {sourceTimestamp && `(${sourceTimestamp})`}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full px-10 py-12 mt-8 mb-8">
        <h2 className="text-3xl md:text-4xl leading-tight font-medium text-white mb-6">
          &ldquo;{highlightedSentence}&rdquo;
        </h2>

        {!isRevealed && (
          <div className="mt-8 w-full max-w-sm">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => onAnswerChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="w-full bg-app-bg/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/50 transition-colors text-center"
              autoFocus
            />
            <p className="text-gray-500 text-sm mt-4">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">Enter</kbd> to reveal
            </p>
          </div>
        )}

        {isRevealed && (
          <div className="mt-8 w-full flex flex-col items-center animate-in fade-in duration-300">
            <p className="text-lg text-gray-400 font-light max-w-xl">
              &ldquo;{translation}&rdquo;
            </p>
            {note && (
              <div className="mt-8 p-4 bg-app-bg/50 border border-app-border rounded-xl text-sm text-left w-full max-w-lg">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Note</span>
                <p className="text-gray-300 mt-1">{note}</p>
              </div>
            )}
            <button
              type="button"
              className="mt-8 w-12 h-12 rounded-full bg-app-surface border border-brand-secondary/30 text-brand-secondary flex items-center justify-center hover:bg-brand-secondary hover:text-white transition shadow-lg hover:shadow-brand-secondary/50"
              title="Play audio"
              aria-label="Play audio"
            >
              <i className="fas fa-volume-up text-lg" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

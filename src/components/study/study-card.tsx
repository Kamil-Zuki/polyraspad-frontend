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

  const badge = srsState ? SRS_BADGE[srsState.state] ?? SRS_BADGE.NEW : SRS_BADGE.NEW;

  return (
    <div
      onClick={!isRevealed ? onReveal : undefined}
      className={`w-full max-w-2xl min-h-[320px] rounded-2xl border border-white/10 bg-app-surface/90 backdrop-blur-sm shadow-xl flex flex-col items-center text-center relative ${
        !isRevealed ? "cursor-pointer hover:border-brand-primary/30 hover:bg-app-surface transition-colors" : ""
      }`}
    >
      {/* Anki-style SRS badge (top right) */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
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
        <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-gray-500">
          {sourceType === "youtube" && <i className="fab fa-youtube text-red-500" />}
          <span>{sourceTitle} {sourceTimestamp && `(${sourceTimestamp})`}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full px-8 py-12">
        {/* Front: sentence only (Anki question style) */}
        <h2 className="text-2xl md:text-3xl leading-relaxed font-medium text-white">
          &ldquo;{highlightedSentence}&rdquo;
        </h2>

        {!isRevealed && (
          <p className="text-gray-500 text-sm mt-6">Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">Space</kbd> to reveal</p>
        )}

        {isRevealed && (
          <div className="mt-8 w-full flex flex-col items-center animate-in fade-in duration-300">
            <div className="h-px w-16 bg-white/20 mb-6" />
            <p className="text-lg text-gray-300 font-light max-w-xl">
              &ldquo;{translation}&rdquo;
            </p>
            {note && (
              <div className="mt-6 p-4 bg-app-bg/60 border border-white/5 rounded-xl text-sm text-left w-full max-w-lg">
                <span className="text-[10px] text-gray-500 uppercase font-semibold">Note</span>
                <p className="text-gray-300 mt-1">{note}</p>
              </div>
            )}
            <button
              type="button"
              className="mt-6 w-10 h-10 rounded-full bg-app-bg border border-white/10 text-gray-400 flex items-center justify-center hover:text-brand-secondary hover:border-brand-secondary/30 transition"
              title="Play audio"
              aria-label="Play audio"
            >
              <i className="fas fa-volume-up text-sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

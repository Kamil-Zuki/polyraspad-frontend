import React, { useRef, useState, useEffect, useCallback } from "react";
import { Volume2 } from "lucide-react";
import { PreviewImage } from "@/components/editor/card-preview";
import type { SentenceMiningStudySection } from "@/lib/editor/sentence-mining-display";
import { apiClient } from "@/lib/api";
import type { TtsSettingsDto } from "@/lib/api/types";
import { useBrowserTts } from "@/hooks/use-browser-tts";
import { sanitizeSourceUrl } from "@/app/reader/reader-utils";

export type SrsCardState = "NEW" | "LEARNING" | "REVIEW" | "RELEARNING" | "MATURE";

export interface StudyCardProps {
  sentence: string;
  targetWord: string;
  /** Exact UTF-16 span in sentence when known (from study API); avoids false split() matches */
  highlightRange?: { start: number; len: number } | null;
  /** Ordered Sentence Mining back fields (Word, transcription, translation, …) */
  backSections: SentenceMiningStudySection[];
  sourceType?: "youtube" | "book" | "article";
  sourceTitle?: string;
  sourceTimestamp?: string;
  sourceUrl?: string;
  imageSrc?: string;
  imageFallbackSrc?: string;
  /** Resolved audio URL (media or Audio field); shown after reveal */
  audioSrc?: string;
  /** FSRS/SRS state for Anki-style badge and interval hint */
  srsState?: { state: string; currentInterval: number };
  /** Card id for linking to shadowing practice */
  cardId?: string;
  /** URL to return to after shadowing */
  returnTo?: string;
  isRevealed: boolean;
  onReveal: () => void;
  targetLang?: string;
  ttsSettings?: TtsSettingsDto | null;
}
const SRS_BADGE: Record<string, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-brand-primary/20 text-brand-primary border-brand-primary/40" },
  LEARNING: { label: "Learning", className: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  REVIEW: { label: "Review", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  RELEARNING: { label: "Relearning", className: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  MATURE: { label: "Review", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
};

function buildHighlightedSentence(
  sentence: string,
  targetWord: string,
  highlightRange?: { start: number; len: number } | null
): string | React.ReactNode[] {
  if (
    highlightRange &&
    highlightRange.len > 0 &&
    highlightRange.start >= 0 &&
    highlightRange.start + highlightRange.len <= sentence.length
  ) {
    const { start, len } = highlightRange;
    const before = sentence.slice(0, start);
    const mid = sentence.slice(start, start + len);
    const after = sentence.slice(start + len);
    const cls =
      "text-brand-primary border-b-2 border-brand-primary/50 pb-0.5";
    return [before, <span key="h0" className={cls}>{mid}</span>, after];
  }

  if (!targetWord) {
    return sentence;
  }

  const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let re: RegExp;
  try {
    re = new RegExp(`\\b${escaped}\\b`, "giu");
  } catch {
    re = new RegExp(`\\b${escaped}\\b`, "gi");
  }

  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(sentence)) !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++;
    }
    parts.push(sentence.slice(last, m.index));
    parts.push(
      <span key={key++} className="text-brand-primary border-b-2 border-brand-primary/50 pb-0.5">
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }

  if (parts.length > 0) {
    parts.push(sentence.slice(last));
    return parts;
  }

  return sentence;
}


/** Custom styled audio player — no native controls, hotkey A, no focus trap */
function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }, []);

  // Hotkey: A = play/pause, blur button immediately so Space still works for reveal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "KeyA" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mb-6 w-full max-w-md shrink-0">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        preload="metadata"
      />
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-gradient-to-r from-brand-primary/10 to-brand-secondary/5 backdrop-blur-sm">
        {/* Play/Pause button — tabIndex -1 so Space doesn't re-trigger it */}
        <button
          tabIndex={-1}
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="w-9 h-9 flex-shrink-0 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary hover:bg-brand-primary/30 active:scale-95 transition-all"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <rect x="6" y="5" width="4" height="14" rx="1"/>
              <rect x="14" y="5" width="4" height="14" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div
          className="flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer relative overflow-hidden group"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Time */}
        <span className="text-[11px] font-mono text-gray-400 flex-shrink-0 w-8 text-right">
          {duration > 0 ? fmt(audioRef.current?.currentTime ?? 0) : "--"}
        </span>

        {/* Hotkey hint */}
        <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-500 font-mono flex-shrink-0">A</kbd>
      </div>
    </div>
  );
}

export function StudyCard({
  sentence,
  targetWord,
  highlightRange,
  backSections,
  sourceType,
  sourceTitle,
  sourceTimestamp,
  sourceUrl,
  imageSrc,
  imageFallbackSrc,
  audioSrc,
  srsState,
  cardId,
  returnTo,
  isRevealed,
  onReveal,
  targetLang,
  ttsSettings,
}: StudyCardProps) {
  const resolvedImageSrc = imageSrc || imageFallbackSrc;
  const highlightedSentence = buildHighlightedSentence(sentence, targetWord, highlightRange);

  const badge = srsState ? SRS_BADGE[srsState.state] ?? SRS_BADGE.NEW : SRS_BADGE.NEW;

  const { speak, cancel, isSpeaking: isSpeakingSentence } = useBrowserTts({
    targetLang,
    ttsSettings,
  });

  const handleSpeakSentence = useCallback(() => {
    if (!sentence?.trim()) return;
    if (isSpeakingSentence) {
      cancel();
      return;
    }
    speak(sentence);
  }, [sentence, isSpeakingSentence, speak, cancel]);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [sentence, cancel]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "KeyR" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        handleSpeakSentence();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSpeakSentence]);

  return (
    <div
      onClick={!isRevealed ? onReveal : undefined}
      className={`w-full max-w-3xl max-h-full rounded-3xl border border-white/10 bg-[rgba(19,25,39,0.8)] backdrop-blur-[20px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col text-center relative overflow-hidden ${
        !isRevealed ? "cursor-pointer hover:border-brand-primary/30 hover:bg-app-surface transition-colors" : ""
      }`}
    >
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span
          className={`px-2.5 py-1 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${badge.className}`}
        >
          {badge.label}
        </span>
        {srsState &&
          (srsState.state === "REVIEW" || srsState.state === "MATURE" || srsState.state === "RELEARNING") &&
          srsState.currentInterval > 0 && (
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

      {(() => {
        const cleanUrl = sanitizeSourceUrl(sourceUrl)
        if (!sourceType && !sourceTitle && !cleanUrl) return null
        return cleanUrl ? (
          <a
            href={cleanUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute top-6 left-6 flex items-center gap-2 text-xs text-gray-500 hover:text-brand-primary transition max-w-[min(420px,55vw)]"
          >
            {sourceType === "youtube" && <i className="fab fa-youtube text-red-500 shrink-0" />}
            {sourceType === "article" && <i className="fas fa-link text-gray-400 shrink-0" />}
            {sourceType === "book" && <i className="fas fa-book text-amber-400/90 shrink-0" />}
            <span className="truncate">
              {sourceTitle || cleanUrl}
              {sourceTimestamp && ` (${sourceTimestamp})`}
            </span>
            <i className="fas fa-external-link-alt text-[10px] shrink-0" />
          </a>
        ) : sourceTitle ? (
          <div className="absolute top-6 left-6 flex items-center gap-2 text-xs text-gray-500 max-w-[min(420px,55vw)]">
            {sourceType === "youtube" && <i className="fab fa-youtube text-red-500 shrink-0" />}
            {sourceType === "article" && <i className="fas fa-link text-gray-400 shrink-0" />}
            {sourceType === "book" && <i className="fas fa-book text-amber-400/90 shrink-0" />}
            <span className="truncate">
              {sourceTitle}
              {sourceTimestamp && ` (${sourceTimestamp})`}
            </span>
          </div>
        ) : null
      })()}

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center w-full px-4 sm:px-10 py-8 sm:py-10 mt-8">
        {resolvedImageSrc && (
          <div className="mb-6 w-full max-w-md shrink-0 rounded-xl overflow-hidden border border-white/10 bg-app-bg/60">
            <PreviewImage
              src={resolvedImageSrc}
              fallbackSrc={imageFallbackSrc || undefined}
              alt="Card"
              imgClassName="w-full max-h-48 object-contain"
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mb-6 shrink-0 w-full max-w-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl leading-tight font-medium text-white">
            &ldquo;{highlightedSentence}&rdquo;
          </h2>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              handleSpeakSentence();
            }}
            className={`shrink-0 p-2 sm:p-2.5 rounded-full border transition-all ${
              isSpeakingSentence
                ? "bg-brand-primary text-white border-brand-primary animate-pulse"
                : "bg-white/5 text-gray-300 border-white/10 hover:bg-brand-primary/20 hover:text-brand-primary hover:border-brand-primary/30"
            }`}
            title="Listen sentence (Browser TTS) [R]"
            aria-label="Listen sentence with browser text to speech [R]"
          >
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {audioSrc?.trim() && <AudioPlayer src={audioSrc.trim()} />}

        {!isRevealed ? (
          <p className="mt-4 text-gray-500 text-sm shrink-0">
            Click the card or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">Space</kbd> to
            reveal
          </p>
        ) : null}

        {isRevealed && (
          <div className="mt-2 w-full max-w-2xl animate-in fade-in duration-300 flex flex-col gap-4 text-left pb-2">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.28em] text-amber-400/90">
              Back
            </p>
            {backSections.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-app-bg/55 px-5 py-4 shadow-inner">
                <dl className="space-y-4">
                  {backSections.map((row) => (
                    <div
                      key={`${row.key}-${row.label}`}
                      className="border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
                    >
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                        {row.label}
                      </dt>
                      <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">
                No back fields filled for this card yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDeck } from "@/lib/react-query/queries";
import { apiClient } from "@/lib/api";
import type { CardStudyDto, StudySessionDto, QueueStatsDto } from "@/lib/api/types";
import { StudyHeader } from "@/components/study/study-header";
import { StudyCard } from "@/components/study/study-card";
import { StudyControls } from "@/components/study/study-controls";
import { useProjectContext } from "@/contexts/project-context";

function cardStudyToStudyCardProps(card: CardStudyDto) {
  const { content } = card;
  const targetWord =
    content.sentence.slice(
      content.targetIndex.start,
      content.targetIndex.start + content.targetIndex.len
    ) || content.targetLemma || "";
  return {
    sentence: content.sentence,
    targetWord,
    translation: content.translation,
    note: undefined,
    sourceType: undefined,
    sourceTitle: undefined,
    sourceTimestamp: undefined,
  };
}

function initialQueueTotal(stats: QueueStatsDto) {
  return stats.new + stats.review + stats.learning;
}

export default function StudySessionPage() {
  const { deckId } = useParams();
  const router = useRouter();
  const { currentProject } = useProjectContext();
  const id = Array.isArray(deckId) ? deckId[0] : deckId ?? "";

  const [session, setSession] = useState<StudySessionDto | null>(null);
  const [currentCard, setCurrentCard] = useState<CardStudyDto | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const cardShownAtRef = useRef<number>(0);

  const {
    data: deck,
    isLoading: isDeckLoading,
    error: deckError,
  } = useDeck(id);

  const deckName = deck?.title ?? "Unknown Deck";
  const projectName = currentProject?.title ?? "Unknown Project";
  const totalInSession = session
    ? initialQueueTotal(session.queueStats)
    : 0;
  const cardsReviewed = session?.cardsReviewed ?? 0;
  const currentIndex = cardsReviewed + (currentCard ? 1 : 0);

  const fetchNextCard = useCallback(async (sessionId: string) => {
    const next = await apiClient.study.getNextCard(sessionId);
    if (next === null) {
      setSessionComplete(true);
      setCurrentCard(null);
    } else {
      setCurrentCard(next);
      setIsRevealed(false);
      cardShownAtRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (!deck?.projectId || !id) return;

    let cancelled = false;
    setError(null);
    setIsStarting(true);

    (async () => {
      try {
        const started = await apiClient.study.startSession({
          projectId: deck.projectId,
          deckId: id,
          mode: "STANDARD",
        });
        if (cancelled) return;
        setSession(started);
        await fetchNextCard(started.id);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to start session");
      } finally {
        if (!cancelled) setIsStarting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deck?.projectId, id, fetchNextCard]);

  const handleRate = async (rating: number) => {
    if (!session || !currentCard) return;

    const durationMs = Math.round(Date.now() - cardShownAtRef.current);
    setIsLoadingNext(true);
    try {
      await apiClient.study.submitReview(session.id, {
        cardId: currentCard.id,
        rating,
        durationMs,
      });
      setSession((prev) =>
        prev
          ? { ...prev, cardsReviewed: prev.cardsReviewed + 1 }
          : null
      );
      await fetchNextCard(session.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handleReveal = () => setIsRevealed(true);

  if (isDeckLoading || isStarting) {
    return (
      <div className="flex-1 flex items-center justify-center bg-app-bg">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (deckError || !deck) {
    return (
      <div className="flex-1 flex items-center justify-center bg-app-bg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Deck not found</h2>
          <p className="text-gray-400 mb-4">
            The deck you&apos;re looking for doesn&apos;t exist or you don&apos;t
            have access to it.
          </p>
          <button
            type="button"
            className="mt-4 px-4 py-2 bg-brand-primary rounded-lg hover:opacity-90"
            onClick={() => router.push("/library")}
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-app-bg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Link
            href={`/study/${id}`}
            className="inline-block mt-4 px-4 py-2 bg-brand-primary rounded-lg hover:opacity-90"
          >
            Back to Deck
          </Link>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-app-bg p-8">
        <div className="glass-panel border border-app-border rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Session complete</h2>
          <p className="text-gray-400 mb-6">
            You reviewed {cardsReviewed} card{cardsReviewed !== 1 ? "s" : ""}.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/study/${id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-medium hover:opacity-90"
            >
              Back to Deck
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-surface border border-app-border text-white font-medium hover:bg-app-hover"
            >
              Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-app-bg text-gray-200 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <StudyHeader
        current={currentIndex}
        total={totalInSession}
        deckName={deckName}
        projectName={projectName}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {currentCard ? (
          <StudyCard
            {...cardStudyToStudyCardProps(currentCard)}
            isRevealed={isRevealed}
            onReveal={handleReveal}
          />
        ) : (
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        )}
      </main>

      <StudyControls
        isRevealed={isRevealed}
        onReveal={handleReveal}
        onRate={handleRate}
        disabled={!currentCard || isLoadingNext}
      />
    </div>
  );
}

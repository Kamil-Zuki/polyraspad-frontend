"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useDeck, useUserSettings, useDailySummary } from "@/lib/react-query/queries";
import { userQueryKeys, analyticsQueryKeys, deckQueryKeys } from "@/lib/react-query/constants";
import { apiClient } from "@/lib/api";
import type {
  CardStudyDto,
  CopilotReviewFeedbackDto,
  QueueStatsDto,
  StudySessionDto,
} from "@/lib/api/types";
import { StudyHeader } from "@/components/study/study-header";
import { StudyCard } from "@/components/study/study-card";
import { StudyControls } from "@/components/study/study-controls";
import { useProjectContext } from "@/contexts/project-context";

function cardStudyToStudyCardProps(card: CardStudyDto) {
  const { content, srsState } = card;
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
    srsState: { state: srsState.state, currentInterval: srsState.currentInterval },
  };
}

/** Format interval for display (e.g. 21 → "21d", 0 → "1m" for learning) */
function formatGoodInterval(state: string, currentInterval: number): string {
  if (state === "NEW" || state === "LEARNING" || currentInterval < 1) return "1d";
  if (currentInterval >= 365) return `${Math.round(currentInterval / 365)}y`;
  if (currentInterval >= 30) return `${Math.round(currentInterval / 30)}mo`;
  if (currentInterval >= 7) return `${Math.round(currentInterval / 7)}w`;
  return `${currentInterval}d`;
}

function initialQueueTotal(stats: QueueStatsDto) {
  return stats.new + stats.review + stats.learning;
}

export default function StudySessionPage() {
  const { deckId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentProject } = useProjectContext();
  const id = Array.isArray(deckId) ? deckId[0] : deckId ?? "";

  const { data: deck, isLoading: isDeckLoading, error: deckError } = useDeck(id);
  const { data: userSettings } = useUserSettings();
  const { data: dailySummary } = useDailySummary(deck?.projectId, {
    enabled: !!deck?.projectId,
  });

  const [session, setSession] = useState<StudySessionDto | null>(null);
  const [currentCard, setCurrentCard] = useState<CardStudyDto | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [copilotFeedback, setCopilotFeedback] = useState<CopilotReviewFeedbackDto | null>(null);
  const [experimentVariant, setExperimentVariant] = useState<string>("control");
  const cardShownAtRef = useRef<number>(0);

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
        const assignment = await apiClient.automation.getExperimentAssignment("study-copilot-2026");
        setExperimentVariant(assignment.variant);
        await apiClient.automation.trackExperimentEvent({
          key: assignment.key,
          variant: assignment.variant,
          eventName: "study_session_started",
          projectId: deck.projectId,
          deckId: id,
        });

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

  // Invalidate cached data when session completes so dashboard/deck show fresh stats
  useEffect(() => {
    if (!sessionComplete || !deck?.projectId) return;
    void queryClient.invalidateQueries({ queryKey: userQueryKeys.userSettings });
    void queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.dailySummary(deck.projectId) });
    void queryClient.invalidateQueries({ queryKey: deckQueryKeys.deck(id) });
    void queryClient.invalidateQueries({ queryKey: deckQueryKeys.deckTree(deck.projectId) });
  }, [sessionComplete, deck?.projectId, id, queryClient]);

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
      const feedback = await apiClient.automation.getCopilotReviewFeedback({
        cardId: currentCard.id,
        sentence: currentCard.content.sentence,
        targetWord:
          currentCard.content.sentence.slice(
            currentCard.content.targetIndex.start,
            currentCard.content.targetIndex.start + currentCard.content.targetIndex.len
          ) || currentCard.content.targetLemma || "",
        translation: currentCard.content.translation,
        rating,
      });
      setCopilotFeedback(feedback);
      await apiClient.automation.trackExperimentEvent({
        key: "study-copilot-2026",
        variant: experimentVariant,
        eventName: `review_rating_${rating}`,
        projectId: deck?.projectId,
        deckId: id,
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

  const handleUndo = async () => {
    if (!session || session.cardsReviewed === 0 || isLoadingNext) return;
    setIsLoadingNext(true);
    try {
      await apiClient.study.undoReview(session.id);
      setCopilotFeedback(null);
      setSession((prev) =>
        prev
          ? { ...prev, cardsReviewed: Math.max(0, prev.cardsReviewed - 1) }
          : null
      );
      await fetchNextCard(session.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to undo");
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handleReveal = () => setIsRevealed(true);

  const goodInterval =
    currentCard?.srsState != null
      ? formatGoodInterval(
          currentCard.srsState.state,
          currentCard.srsState.currentInterval
        )
      : "5d";

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
    const streak = userSettings?.currentStreak ?? dailySummary?.currentStreak ?? 0;
    const reviews = dailySummary?.reviews || { current: 0, target: 0, isCompleted: false };
    const newCards = dailySummary?.newCards || { current: 0, target: 0, isCompleted: false };
    const dailyGoalsDone = reviews.isCompleted && newCards.isCompleted;

    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-app-bg p-8">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-app-surface/90 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-3xl text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Session complete</h2>
          <p className="text-gray-400 text-sm mb-2">
            {cardsReviewed} card{cardsReviewed !== 1 ? "s" : ""} reviewed
          </p>

          {/* Streak & daily progress (Summary per IA) */}
          {(streak > 0 || reviews.target > 0 || newCards.target > 0) && (
            <div className="mt-6 mb-6 space-y-3 text-left">
              {streak > 0 && (
                <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                  <span className="text-sm text-gray-400">Streak</span>
                  <span className="text-brand-primary font-bold">
                    {streak} day{streak !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {reviews.target > 0 && (
                <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-sm text-gray-400">Reviews today</span>
                  <span className={reviews.isCompleted ? "text-emerald-400 font-medium" : "text-white"}>
                    {reviews.current} / {reviews.target}
                  </span>
                </div>
              )}
              {newCards.target > 0 && (
                <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-sm text-gray-400">New cards today</span>
                  <span className={newCards.isCompleted ? "text-emerald-400 font-medium" : "text-white"}>
                    {newCards.current} / {newCards.target}
                  </span>
                </div>
              )}
              {dailyGoalsDone && (
                <p className="text-center text-sm text-emerald-400 font-medium">
                  Daily goals completed! 🎉
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-primary text-white font-medium hover:opacity-90 transition"
            >
              Back to Dashboard
            </Link>
            <Link
              href={`/study/${id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-gray-300 font-medium hover:bg-white/5 transition"
            >
              Back to deck
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-gray-500 font-medium hover:bg-white/5 transition text-sm"
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
          <div className="w-full max-w-3xl">
            <StudyCard
              {...cardStudyToStudyCardProps(currentCard)}
              isRevealed={isRevealed}
              onReveal={handleReveal}
            />
            {copilotFeedback && (
              <div className="mt-4 rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-4">
                <p className="text-sm font-semibold text-brand-secondary">Study Copilot</p>
                <p className="text-sm text-gray-200 mt-1">{copilotFeedback.explanation}</p>
                <p className="text-xs text-gray-300 mt-2">{copilotFeedback.actionHint}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        )}
      </main>

      <StudyControls
        isRevealed={isRevealed}
        onReveal={handleReveal}
        onRate={handleRate}
        onUndo={handleUndo}
        canUndo={session != null && session.cardsReviewed > 0 && !isLoadingNext}
        disabled={!currentCard || isLoadingNext}
        goodInterval={goodInterval}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useDeck, useUserSettings, useDailySummary } from "@/lib/react-query/queries";
import { userQueryKeys, analyticsQueryKeys, deckQueryKeys } from "@/lib/react-query/constants";
import { apiClient } from "@/lib/api";
import type { CardStudyDto, QueueStatsDto, StudySessionDto } from "@/lib/api/types";
import { StudyHeader } from "@/components/study/study-header";
import { StudyCard } from "@/components/study/study-card";
import { StudyControls } from "@/components/study/study-controls";
import { StudyAiTutor } from "@/components/study/study-ai-tutor";
import {
  formatStudyIntervals,
  toStudyCardViewModel,
} from "@/components/study/study-session-presenter";
import { useProjectContext } from "@/contexts/project-context";
import { ROUTES } from "@/lib/constants";
import { sanitizeInternalReturnPath } from "@/lib/navigation/safe-return-path";

function initialQueueTotal(stats: QueueStatsDto) {
  return stats.new + stats.review + stats.learning;
}

export default function StudySessionPage() {
  const { deckId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { currentProject } = useProjectContext();
  const id = Array.isArray(deckId) ? deckId[0] : deckId ?? "";

  const returnPath = useMemo(
    () => sanitizeInternalReturnPath(searchParams.get("returnTo")),
    [searchParams]
  );
  const exitHref = returnPath ?? `/study/${id}`;

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
  const [leechNotification, setLeechNotification] = useState(false); // Состояние для уведомления о личе
  const [experimentVariant, setExperimentVariant] = useState<string>("control");
  const [cardFailCounts, setCardFailCounts] = useState<Record<string, number>>({});
  const [tutorCard, setTutorCard] = useState<CardStudyDto | null>(null);
  const [seenCards, setSeenCards] = useState<Set<string>>(new Set());
  const cardShownAtRef = useRef<number>(0);

  const deckName = deck?.title ?? "Unknown Deck";
  const projectName = currentProject?.title ?? "Unknown Project";
  const totalInSession = session
    ? initialQueueTotal(session.queueStats)
    : 0;
  
  useEffect(() => {
    if (currentCard) {
      setSeenCards(prev => {
        if (prev.has(currentCard.id)) return prev;
        const next = new Set(prev);
        next.add(currentCard.id);
        return next;
      });
    }
  }, [currentCard?.id]);

  const cardsReviewed = session?.cardsReviewed ?? 0;
  const currentIndex = Math.min(seenCards.size, Math.max(totalInSession, 1));

  // «Нет карт в сессии» — нормальное завершение сессии, не ошибка (бэкенд может вернуть 204 или ранее возвращал 404)
  const isNoMoreCardsError = useCallback((e: unknown) => {
    return e instanceof Error && e.message.includes("No more cards in session");
  }, []);

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
  }, [id, deck?.projectId, queryClient]);

  useEffect(() => {
    if (!deck?.projectId || !id) return;

    let cancelled = false;
    setError(null);
    setIsStarting(true);

    (async () => {
      try {
        // Эксперименты — необязательны: старый BFF без /experiments/* не должен блокировать учёбу
        const defaultKey = "study-copilot-2026";
        let expKey = defaultKey;
        let expVariant = "control";
        try {
          const assignment = await apiClient.automation.getExperimentAssignment(defaultKey);
          expKey = assignment.key;
          expVariant = assignment.variant;
          setExperimentVariant(expVariant);
        } catch {
          setExperimentVariant("control");
        }
        try {
          await apiClient.automation.trackExperimentEvent({
            key: expKey,
            variant: expVariant,
            eventName: "study_session_started",
            projectId: deck.projectId,
            deckId: id,
          });
        } catch {
          /* игнорируем отсутствие POST /experiments/events */
        }

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
        if (isNoMoreCardsError(e)) {
          setSessionComplete(true);
          setCurrentCard(null);
          setError(null);
        } else {
          setError(e instanceof Error ? e.message : "Failed to start session");
        }
      } finally {
        if (!cancelled) setIsStarting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deck?.projectId, id, fetchNextCard, isNoMoreCardsError]);

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

    if (rating === 1) {
      setCardFailCounts((prev) => {
        const next = { ...prev, [currentCard.id]: (prev[currentCard.id] ?? 0) + 1 };
        if (next[currentCard.id] === 2) {
          setTutorCard(currentCard);
        }
        return next;
      });
    } else {
      setTutorCard(null);
    }

    const durationMs = Math.round(Date.now() - cardShownAtRef.current);
    setIsLoadingNext(true);
    try {
      const reviewResult = await apiClient.study.submitReview(session.id, {
        cardId: currentCard.id,
        rating,
        durationMs,
      });

      // Показ уведомления о личе (если карта была отмечена как leech)
      if (reviewResult.isLeech) {
        setLeechNotification(true);
        setTimeout(() => setLeechNotification(false), 5000);
      }

      try {
        await apiClient.automation.trackExperimentEvent({
          key: "study-copilot-2026",
          variant: experimentVariant,
          eventName: `review_rating_${rating}`,
          projectId: deck?.projectId,
          deckId: id,
        });
      } catch {
        /* необязательная телеметрия */
      }
      setSession((prev) =>
        prev
          ? { ...prev, cardsReviewed: prev.cardsReviewed + 1 }
          : null
      );
      // Бэкенд сам отдаёт карту досрочно (learn ahead), если других карт нет — как в Anki
      setTutorCard(null);
      await fetchNextCard(session.id);
    } catch (e) {
      if (isNoMoreCardsError(e)) {
        setSessionComplete(true);
        setCurrentCard(null);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Failed to submit review");
      }
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handleUndo = async () => {
    if (!session || session.cardsReviewed === 0 || isLoadingNext) return;
    setIsLoadingNext(true);
    try {
      await apiClient.study.undoReview(session.id);
      setSession((prev) =>
        prev
          ? { ...prev, cardsReviewed: Math.max(0, prev.cardsReviewed - 1) }
          : null
      );
      await fetchNextCard(session.id);
    } catch (e) {
      if (isNoMoreCardsError(e)) {
        setSessionComplete(true);
        setCurrentCard(null);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Failed to undo");
      }
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handleReveal = () => setIsRevealed(true);
  const handleDismissTutor = useCallback(() => setTutorCard(null), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        
        if (currentCard) {
          e.preventDefault();
          router.push(`/editor?cardId=${currentCard.id}&returnTo=${encodeURIComponent(exitHref)}`);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentCard, router, exitHref]);

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
            onClick={() => router.push(ROUTES.DECKS)}
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
            href={exitHref}
            className="inline-block mt-4 px-4 py-2 bg-brand-primary rounded-lg hover:opacity-90"
          >
            {returnPath ? "Back" : "Back to Deck"}
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
            {returnPath ? (
              <Link
                href={returnPath}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-primary text-white font-medium hover:opacity-90 transition"
              >
                Continue reading
              </Link>
            ) : null}
            <Link
              href="/dashboard"
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition ${
                returnPath
                  ? "border border-white/10 text-gray-300 hover:bg-white/5"
                  : "bg-brand-primary text-white hover:opacity-90"
              }`}
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
              href={ROUTES.DECKS}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-gray-500 font-medium hover:bg-white/5 transition text-sm"
            >
              Decks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-app-bg text-gray-200 relative font-sans">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <StudyHeader
        current={currentIndex}
        total={totalInSession}
        deckName={deckName}
        projectName={projectName}
        exitHref={exitHref}
      />

      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-4 py-4 sm:px-6 sm:py-6 relative z-10">
        {leechNotification && (
          <div className="sticky top-0 z-50 mb-4 animate-in slide-in-from-top duration-300">
            <div className="bg-amber-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-amber-400/50">
              <i className="fas fa-exclamation-triangle" />
              <span className="text-sm font-medium">This card was marked as a leech and suspended.</span>
            </div>
          </div>
        )}

        {tutorCard && (
        <StudyAiTutor
          card={tutorCard}
          sourceLang={currentProject?.sourceLang}
          targetLang={currentProject?.targetLang}
          onDismiss={handleDismissTutor}
        />
      )}

      {currentCard ? (
          <div className="w-full max-w-3xl min-h-0 flex-1 flex flex-col">
            <StudyCard
              {...toStudyCardViewModel(currentCard)}
              cardId={currentCard.id}
              returnTo={exitHref}
              isRevealed={isRevealed}
              onReveal={handleReveal}
              targetLang={currentProject?.targetLang}
              ttsSettings={currentProject?.ttsSettings}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </main>

      {process.env.NODE_ENV === "development" && currentCard?.srsState ? (
        <p className="shrink-0 text-center text-[10px] text-gray-500 pb-1 font-mono">
          SRS {currentCard.srsState.state}
          {currentCard.srsState.step != null ? ` · step ${currentCard.srsState.step}` : ""}
          {currentCard.srsState.dueUtc ? ` · due ${currentCard.srsState.dueUtc}` : ""}
        </p>
      ) : null}

      <div className="shrink-0 border-t border-white/5 bg-app-bg/95 backdrop-blur-sm">
        <StudyControls
          isRevealed={isRevealed}
          onReveal={handleReveal}
          onRate={handleRate}
          onUndo={handleUndo}
          canUndo={session != null && session.cardsReviewed > 0 && !isLoadingNext}
          disabled={!currentCard || isLoadingNext}
          intervals={formatStudyIntervals(currentCard?.nextIntervals)}
        />
      </div>
    </div>
  );
}

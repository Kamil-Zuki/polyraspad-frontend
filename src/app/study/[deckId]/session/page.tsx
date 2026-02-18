"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDeck, useCardsByDeck } from "@/lib/react-query/queries";
import { StudyHeader } from "@/components/study/study-header";
import { StudyCard } from "@/components/study/study-card";
import { StudyControls } from "@/components/study/study-controls";
import { useProjectContext } from "@/contexts/project-context";

export default function StudySessionPage() {
  const { deckId } = useParams();
  const router = useRouter();
  const { currentProject } = useProjectContext();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const id = Array.isArray(deckId) ? deckId[0] : deckId;
  const {
    data: deck,
    isLoading: isDeckLoading,
    error: deckError,
  } = useDeck(id ?? "");
  const {
    data: cardsData,
    isLoading: isCardsLoading,
    error: cardsError,
  } = useCardsByDeck(id ?? "");

  const isLoading = isDeckLoading || isCardsLoading;
  const error = deckError || cardsError;

  const sessionData = {
    total: cardsData?.totalCount ?? 0,
    deckName: deck?.title ?? "Unknown Deck",
    projectName: currentProject?.title ?? "Unknown Project",
    cards: cardsData?.items ?? [],
  };

  const currentCard =
    sessionData.cards[currentCardIndex % Math.max(sessionData.cards.length, 1)];

  const handleRate = (rating: number) => {
    setIsRevealed(false);
    setCurrentCardIndex(
      (prev) => (prev + 1) % Math.max(sessionData.cards.length, 1),
    );
  };

  const handleReveal = () => setIsRevealed(true);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-app-bg">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !deck || sessionData.cards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-app-bg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Deck not found</h2>
          <p className="text-gray-400 mb-4">
            The deck you're looking for doesn't exist or you don't have access
            to it.
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

  return (
    <div className="h-screen flex flex-col bg-app-bg text-gray-200 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <StudyHeader
        current={currentCardIndex + 1}
        total={sessionData.total}
        deckName={sessionData.deckName}
        projectName={sessionData.projectName}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {currentCard ? (
          <StudyCard
            {...currentCard}
            isRevealed={isRevealed}
            onReveal={handleReveal}
          />
        ) : (
          <div className="text-center text-white">
            No cards available in this deck
          </div>
        )}
      </main>

      <StudyControls
        isRevealed={isRevealed}
        onReveal={handleReveal}
        onRate={handleRate}
      />
    </div>
  );
}

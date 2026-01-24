"use client"

import React, { useState } from 'react';
import { StudyHeader } from '@/components/study/study-header';
import { StudyCard } from '@/components/study/study-card';
import { StudyControls } from '@/components/study/study-controls';

export default function StudyPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Mock data for the session
  const sessionData = {
    total: 50,
    deckName: "Business Idioms",
    projectName: "English C1",
    cards: [
      {
        id: 1,
        sentence: "Success is not final, failure is not fatal.",
        targetWord: "fatal",
        translation: "Успех не окончателен, неудача не смертельна.",
        note: "Fatal — causing death. Often confused with 'fateful' (судьбоносный).",
        sourceType: 'youtube' as const,
        sourceTitle: 'TED Talk',
        sourceTimestamp: '12:45'
      },
      {
        id: 2,
        sentence: "We need to address the elephant in the room.",
        targetWord: "elephant in the room",
        translation: "Нам нужно обсудить очевидную проблему, которую все игнорируют.",
        note: "An obvious problem or difficult situation that people do not want to talk about.",
        sourceType: 'youtube' as const,
        sourceTitle: 'Business Meeting Pro',
        sourceTimestamp: '05:20'
      }
    ]
  };

  const currentCard = sessionData.cards[currentCardIndex % sessionData.cards.length];

  const handleRate = (rating: number) => {
    console.log(`Rated card ${currentCard.id} with ${rating}`);
    setIsRevealed(false);
    setCurrentCardIndex(prev => prev + 1);
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  return (
    <div className="h-screen flex flex-col bg-app-bg text-gray-200 relative overflow-hidden font-sans">
      {/* Ambient Background Light */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. TOP BAR */}
      <StudyHeader 
        current={currentCardIndex + 1}
        total={sessionData.total}
        deckName={sessionData.deckName}
        projectName={sessionData.projectName}
      />

      {/* 2. MAIN CARD AREA */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <StudyCard 
          {...currentCard}
          isRevealed={isRevealed}
          onReveal={handleReveal}
        />
      </main>

      {/* 3. CONTROLS */}
      <StudyControls 
        isRevealed={isRevealed}
        onReveal={handleReveal}
        onRate={handleRate}
      />
    </div>
  );
}

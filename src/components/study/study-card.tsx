import React, { useState } from 'react';

interface StudyCardProps {
  sentence: string;
  targetWord: string;
  translation: string;
  note?: string;
  sourceType?: 'youtube' | 'book' | 'article';
  sourceTitle?: string;
  sourceTimestamp?: string;
  isRevealed: boolean;
  onReveal: () => void;
}

export function StudyCard({
  sentence,
  targetWord,
  translation,
  note,
  sourceType,
  sourceTitle,
  sourceTimestamp,
  isRevealed,
  onReveal
}: StudyCardProps) {
  // Replace the target word with a highlighted version
  const highlightedSentence = sentence.split(targetWord).reduce((acc, part, i, arr) => {
    if (i === 0) return [part];
    return [...acc, <span key={i} className="text-brand-primary border-b-2 border-brand-primary/50 pb-0.5">{targetWord}</span>, part];
  }, [] as (string | React.ReactNode)[]);

  return (
    <div 
      onClick={!isRevealed ? onReveal : undefined}
      className={`glass-panel w-full max-w-3xl min-h-[400px] rounded-3xl p-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-glow relative cursor-pointer ${
        !isRevealed ? 'hover:border-brand-primary/30' : ''
      }`}
    >
      {/* Tags / Meta */}
      <div className="absolute top-6 right-6 flex gap-2">
        <span className="px-2 py-1 rounded bg-app-bg border border-app-border text-[10px] text-gray-500 uppercase tracking-wider font-bold">
          New Word
        </span>
      </div>

      {/* Source Context */}
      {sourceType && (
        <div className="absolute top-6 left-6 flex items-center gap-2 text-xs text-gray-500 hover:text-brand-primary cursor-pointer transition">
          {sourceType === 'youtube' && <i className="fab fa-youtube text-red-500" />}
          <span>{sourceTitle} {sourceTimestamp && `(${sourceTimestamp})`}</span>
          <i className="fas fa-external-link-alt text-[10px] ml-1" />
        </div>
      )}

      {/* Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full mt-8 mb-8">
        {/* Sentence (Front) */}
        <h2 className="text-3xl md:text-4xl leading-tight font-medium text-white mb-8">
          "{highlightedSentence}"
        </h2>

        {isRevealed ? (
          <div className="animate-in fade-in duration-500 w-full flex flex-col items-center">
            {/* Translation (Back) */}
            <div className="text-lg text-gray-400 font-light max-w-xl mb-8">
              "{translation}"
            </div>

            {/* Grammar / Notes */}
            {note && (
              <div className="p-4 bg-app-bg/50 border border-app-border rounded-xl text-sm text-left w-full max-w-lg mb-8">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Note</div>
                <p className="text-gray-300">{note}</p>
              </div>
            )}

            {/* Audio Button */}
            <button className="w-12 h-12 rounded-full bg-app-surface border border-brand-secondary/30 text-brand-secondary flex items-center justify-center hover:bg-brand-secondary hover:text-white transition shadow-lg hover:shadow-brand-secondary/50">
              <i className="fas fa-volume-up text-lg" />
            </button>
          </div>
        ) : (
          <div className="text-gray-600 text-sm mt-4 animate-pulse">
            Click or press Space to reveal
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { useRouter } from 'next/navigation';

interface StudyHeaderProps {
  current: number;
  total: number;
  deckName: string;
  projectName: string;
}

export function StudyHeader({ current, total, deckName, projectName }: StudyHeaderProps) {
  const router = useRouter();
  const progress = (current / total) * 100;

  return (
    <header className="h-16 flex items-center justify-between px-8 z-20 relative bg-app-bg/50 backdrop-blur-sm">
      {/* Progress */}
      <div className="flex items-center gap-4 w-1/3">
        <span className="text-sm font-mono text-gray-400">
          {current} <span className="text-gray-600">/</span> {total}
        </span>
        <div className="h-1.5 w-32 bg-app-surface rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary shadow-[0_0_8px_rgba(139,92,246,0.5)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Deck Info */}
      <div className="text-sm font-medium text-gray-400">
        {projectName} <span className="mx-2 text-gray-700">•</span> {deckName}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 w-1/3 justify-end">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition" title="Settings">
          <i className="fas fa-cog" />
        </button>
        <button 
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition" 
          title="Exit"
        >
          <i className="fas fa-times text-lg" />
        </button>
      </div>
    </header>
  );
}

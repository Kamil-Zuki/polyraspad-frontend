"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface StudyHeaderProps {
  current: number;
  total: number;
  deckName: string;
  projectName: string;
}

export function StudyHeader({ current, total, deckName, projectName }: StudyHeaderProps) {
  const params = useParams();
  const deckId = Array.isArray(params?.deckId) ? params.deckId[0] : params?.deckId;
  const progress = total > 0 ? (current / total) * 100 : 0;
  const remaining = Math.max(0, total - current);

  return (
    <header className="h-14 flex items-center justify-between px-6 z-20 relative border-b border-white/5 bg-app-bg/80 backdrop-blur-sm">
      {/* Anki-style: progress + remaining */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-mono text-gray-400 shrink-0">
          {remaining} <span className="text-gray-600">remaining</span>
        </span>
        <div className="h-1.5 w-24 sm:w-32 bg-app-surface rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-brand-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Deck context */}
      <div className="text-sm text-gray-500 truncate mx-4 min-w-0 text-center">
        <span className="truncate">{deckName}</span>
        <span className="mx-1.5 text-gray-600">·</span>
        <span className="truncate text-gray-600">{projectName}</span>
      </div>

      {/* Exit to deck (Anki: no sidebar, just exit) */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={deckId ? `/study/${deckId}` : "/library"}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition"
          title="Exit session"
        >
          <i className="fas fa-times text-lg" />
        </Link>
      </div>
    </header>
  );
}

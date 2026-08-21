"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/constants";

interface StudyHeaderProps {
  current: number;
  total: number;
  deckName: string;
  projectName: string;
  /** When set (e.g. reader return URL), exit (×) navigates here instead of deck overview */
  exitHref?: string;
}

export function StudyHeader({
  current,
  total,
  deckName,
  projectName,
  exitHref,
}: StudyHeaderProps) {
  const params = useParams();
  const deckId = Array.isArray(params?.deckId) ? params.deckId[0] : params?.deckId;
  const exitTarget = exitHref ?? (deckId ? `/study/${deckId}` : ROUTES.DECKS);
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-8 z-20 relative">
      <div className="flex items-center gap-3 w-1/3 min-w-0">
        <Link
          href={exitTarget}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-mono text-gray-400 shrink-0">
            {current} <span className="text-gray-600">/</span> {total}
          </span>
          <div className="h-1.5 w-16 sm:w-24 md:w-32 bg-app-surface rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-300 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-sm font-medium text-gray-400 truncate mx-4 min-w-0 text-center">
        <span className="truncate">{projectName}</span>
        <span className="mx-2 text-gray-700">•</span>
        <span className="truncate">{deckName}</span>
      </div>

      <div className="flex items-center gap-4 w-1/3 justify-end shrink-0">
        <Link
          href={exitTarget}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition"
          title="Exit session"
          aria-label="Exit session"
        >
          <i className="fas fa-times text-lg" />
        </Link>
      </div>
    </header>
  );
}

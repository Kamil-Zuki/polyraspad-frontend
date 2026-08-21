"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { ReaderChapter } from "@/app/reader/reader-utils"
import type { ReaderLibraryBook } from "@/app/reader/library-storage"

export type ReaderSessionDocKind = "text" | "pdf" | "epub"

interface ReaderStatsSnippet {
  uniqueWords: number
  knownPercentage: number
}

export interface ReaderSessionBookChromeProps {
  docKind: ReaderSessionDocKind
  sourceTitle: string
  currentProjectTitle: string
  activeCollectionName: string
  activeBook: ReaderLibraryBook | null
  currentReaderChapter: ReaderChapter | null
  isReadingMode: boolean
  onBackToLibrary: () => void
  onOpenInspector: () => void
  onEnterFocusMode: () => void
  sessionReviewHref: string | null
  inboxStudySummary?: string
  hasReaderStats: boolean
  readerStats?: ReaderStatsSnippet | null
  newTermsCount?: number
  savedTermsCount?: number
  activeBookId: string | null
}

export function ReaderSessionBookChrome({
  docKind,
  sourceTitle,
  currentProjectTitle,
  activeCollectionName,
  activeBook,
  currentReaderChapter,
  isReadingMode,
  onBackToLibrary,
  onOpenInspector,
  onEnterFocusMode,
  sessionReviewHref,
  inboxStudySummary,
  hasReaderStats,
  readerStats,
  newTermsCount,
  savedTermsCount,
  activeBookId,
}: ReaderSessionBookChromeProps) {
  return (
    <div className="relative border-b border-white/5 glass-panel px-5 py-4 md:px-6">
      <div className="flex w-full items-center justify-between">
        {/* The title and breadcrumbs have been removed to prevent duplication with the page header */}

        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {isReadingMode ? (
              <button
                type="button"
                onClick={onBackToLibrary}
                className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-app-hover transition-colors"
              >
                <i className="fas fa-arrow-left mr-1.5" />
                Back to library
              </button>
            ) : null}
          </div>

          <details className="group w-full md:w-auto md:max-w-xl [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-app-hover transition-colors md:inline-flex md:justify-end">
              <span>More tools</span>
              <i className="fas fa-chevron-down text-[10px] transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="mt-2 flex w-full flex-col gap-2 rounded-[22px] border border-app-border bg-[#0f1520]/95 p-3 shadow-xl backdrop-blur md:flex-row md:flex-wrap md:justify-end z-50 relative">
              {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && (
                <button
                  type="button"
                  onClick={onOpenInspector}
                  className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-app-hover transition-colors"
                >
                  <i className="fas fa-sliders mr-1.5" />
                  Inspector
                </button>
              )}
              <div className="flex items-center rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs text-gray-300">
                <i className="fas fa-file-lines mr-1.5" />
                <span>Jump to page: </span>
                <input
                  type="number"
                  min={1}
                  className="w-12 ml-1 bg-transparent text-white outline-none placeholder:text-gray-500"
                  placeholder="#"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const p = parseInt(e.currentTarget.value, 10);
                      if (!isNaN(p) && typeof window !== 'undefined') {
                         window.dispatchEvent(new CustomEvent('reader:goto-page', { detail: p }));
                      }
                    }
                  }}
                />
              </div>
              {!isReadingMode ? (
                <button
                  type="button"
                  onClick={onEnterFocusMode}
                  className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-app-hover transition-colors"
                >
                  <i className="fas fa-expand mr-1.5" />
                  Focus mode
                </button>
              ) : null}
              {sessionReviewHref ? (
                <Link
                  href={sessionReviewHref}
                  prefetch={false}
                  className="inline-flex items-center justify-center rounded-full border border-brand-primary/50 bg-brand-primary/20 px-3 py-1.5 text-xs font-semibold text-brand-secondary shadow-sm hover:bg-brand-primary/30 transition-colors"
                >
                  <i className="fas fa-play mr-1.5" aria-hidden />
                  Session review
                  {inboxStudySummary ? <span className="ml-2 font-normal opacity-90">({inboxStudySummary})</span> : null}
                </Link>
              ) : null}
              {activeBookId ? (
                <span className="inline-flex items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-300">
                  <i className="fas fa-book mr-1.5" />
                  Library book
                </span>
              ) : null}
              {hasReaderStats && readerStats ? (
                <>
                  <span className="inline-flex items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-300">
                    New <strong className="ml-1 text-white">{newTermsCount ?? readerStats.uniqueWords}</strong>
                  </span>
                  <span className="inline-flex items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
                    Saved <strong className="ml-1 text-white">{savedTermsCount ?? 0}</strong>
                  </span>
                  <span className="inline-flex items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                    Known <strong className="ml-1 text-white">{Math.round(readerStats.knownPercentage * 100)}%</strong>
                  </span>
                </>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

export interface ReaderSessionPaginationStripProps {
  docKind: ReaderSessionDocKind
  totalReaderPages: number
  displayedPageNumber: number
  currentReaderChapter: ReaderChapter | null
  readerChapters: ReaderChapter[]
  chapterPageNumbers: Map<string, number>
  previousReaderChapter: ReaderChapter | null
  nextReaderChapter: ReaderChapter | null
  onGoToReaderChapter: (chapterId: string) => void
  markKnownOnPageTurn: boolean
  onPersistMarkKnownOnPageTurn: (value: boolean) => void
  isReaderPageLoading: boolean
  isPageTurnBusy: boolean
  onPreviousPage: () => void
  onNextPage: () => void
  onGoToPage?: (page: number) => void
}

export function ReaderSessionPaginationStrip({
  docKind,
  totalReaderPages,
  displayedPageNumber,
  currentReaderChapter,
  readerChapters,
  chapterPageNumbers,
  previousReaderChapter,
  nextReaderChapter,
  onGoToReaderChapter,
  markKnownOnPageTurn,
  onPersistMarkKnownOnPageTurn,
  isReaderPageLoading,
  isPageTurnBusy,
  onPreviousPage,
  onNextPage,
  onGoToPage,
}: ReaderSessionPaginationStripProps) {
  const [pageInput, setPageInput] = useState(String(displayedPageNumber || 1))

  useEffect(() => {
    setPageInput(String(displayedPageNumber || 1))
  }, [displayedPageNumber])

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(pageInput, 10)
    if (!isNaN(p) && p >= 1 && p <= Math.max(totalReaderPages, 1) && onGoToPage) {
      onGoToPage(p)
    } else {
      setPageInput(String(displayedPageNumber || 1))
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-2">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
          {docKind === "pdf" ? "PDF pagination" : docKind === "epub" ? "EPUB spine" : "Text pagination"}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          {docKind === "pdf"
            ? `${totalReaderPages} PDF page${totalReaderPages === 1 ? "" : "s"} available`
            : docKind === "epub"
              ? `${totalReaderPages} spine chapter${totalReaderPages === 1 ? "" : "s"} in this book`
              : `${totalReaderPages} text page${totalReaderPages === 1 ? "" : "s"} in this reading session`}
        </div>
        {currentReaderChapter ? (
          <div className="mt-1 text-xs font-medium text-gray-300">Current chapter: {currentReaderChapter.title}</div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={isReaderPageLoading || isPageTurnBusy || displayedPageNumber <= 1}
          className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:text-white hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="fas fa-chevron-left mr-1.5 text-[10px]" />
          Previous
        </button>
        <form
          onSubmit={handlePageSubmit}
          className="flex items-center rounded-full border border-app-border bg-app-surface px-3 py-1 text-xs text-gray-300 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-colors"
        >
          <span>Page </span>
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={handlePageSubmit}
            disabled={isReaderPageLoading || isPageTurnBusy}
            className="w-10 bg-transparent text-center text-white outline-none mx-1"
          />
          <span> of {Math.max(totalReaderPages, 1)}</span>
        </form>
        <button
          type="button"
          onClick={onNextPage}
          disabled={isReaderPageLoading || isPageTurnBusy || displayedPageNumber >= totalReaderPages}
          className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:text-white hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <i className="fas fa-chevron-right ml-1.5 text-[10px]" />
        </button>

        <details className="group w-full md:w-auto md:min-w-[240px] [&_summary::-webkit-details-marker]:hidden xl:w-auto">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-app-hover transition-colors">
            <span>More reading options</span>
            <i className="fas fa-chevron-down text-[10px] transition group-open:rotate-180" aria-hidden />
          </summary>
          <div className="mt-2 flex w-full flex-col gap-2 rounded-[22px] border border-app-border bg-[#0f1520]/95 p-3 shadow-xl backdrop-blur md:flex-row md:flex-wrap md:items-center z-50 relative">
            {readerChapters.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => previousReaderChapter && onGoToReaderChapter(previousReaderChapter.id)}
                  disabled={!previousReaderChapter || docKind === "pdf" || docKind === "epub" || isPageTurnBusy}
                  className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:text-white hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fas fa-angles-left mr-1.5 text-[10px]" />
                  Chapter
                </button>
                <select
                  value={currentReaderChapter?.id ?? ""}
                  onChange={(event) => onGoToReaderChapter(event.target.value)}
                  disabled={docKind === "pdf" || docKind === "epub" || isPageTurnBusy}
                  aria-label="Choose chapter"
                  className="max-w-[260px] rounded-full border border-app-border bg-app-surface text-gray-300 px-3 py-1.5 text-xs font-medium transition hover:text-white hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50 outline-none"
                >
                  {readerChapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id} className="bg-app-bg text-gray-300">
                      {chapter.title}
                      {chapterPageNumbers.get(chapter.id) ? ` · p. ${chapterPageNumbers.get(chapter.id)}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => nextReaderChapter && onGoToReaderChapter(nextReaderChapter.id)}
                  disabled={!nextReaderChapter || docKind === "pdf" || docKind === "epub" || isPageTurnBusy}
                  className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:text-white hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Chapter
                  <i className="fas fa-angles-right ml-1.5 text-[10px]" />
                </button>
              </>
            ) : null}
            <label className="flex max-w-[320px] cursor-pointer items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium leading-snug text-gray-300 hover:text-white hover:bg-app-hover transition-colors md:max-w-xs">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 shrink-0 rounded border-gray-600 bg-gray-800 text-brand-primary focus:ring-brand-primary focus:ring-offset-gray-900"
                checked={markKnownOnPageTurn}
                onChange={(event) => onPersistMarkKnownOnPageTurn(event.target.checked)}
                aria-label="Mark remaining new words as known when turning the page"
              />
              <span>Mark new words known on page turn</span>
            </label>
          </div>
        </details>
      </div>
    </div>
  )
}

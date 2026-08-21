"use client"

import type { ReaderLibraryBook } from "@/app/reader/library-storage"
import { cn } from "@/lib/utils"

interface ReaderLibraryBookCardProps {
  book: ReaderLibraryBook
  index: number
  isActive: boolean
  isSharedBook: boolean
  isBookBusy: boolean
  targetCollectionName?: string | null
  canMoveToCollection: boolean
  onRead: () => void
  onDelete?: () => void
  onEdit?: () => void
  onMoveToCollection?: () => void
  onClearCollection?: () => void
  onShare: () => void
  onDragStart?: (bookId: string) => void
  onDragEnd?: () => void
}

const coverClasses = [
  "from-[#18354a] via-[#10283c] to-[#0b1726]",
  "from-[#4a2f18] via-[#302010] to-[#17100a]",
  "from-[#213b31] via-[#122721] to-[#091610]",
  "from-[#3d2234] via-[#251426] to-[#120c15]",
  "from-[#2c3554] via-[#171f38] to-[#0d1221]",
]

export function ReaderLibraryBookCard({
  book,
  index,
  isActive,
  isSharedBook,
  isBookBusy,
  targetCollectionName,
  canMoveToCollection,
  onRead,
  onDelete,
  onEdit,
  onMoveToCollection,
  onClearCollection,
  onShare,
  onDragStart,
  onDragEnd,
}: ReaderLibraryBookCardProps) {
  const coverClass = coverClasses[index % coverClasses.length]

  return (
    <article
      draggable={!isSharedBook}
      onDragStart={(e) => {
        if (isSharedBook) return
        e.dataTransfer.setData("text/plain", book.id)
        e.dataTransfer.effectAllowed = "move"
        onDragStart?.(book.id)
      }}
      onDragEnd={() => onDragEnd?.()}
      className={cn(
        "overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] transition",
        isActive
          ? "border-emerald-300/50 shadow-[0_20px_42px_rgba(0,0,0,0.26)]"
          : "border-white/10 hover:border-white/20 hover:bg-white/[0.05]",
      )}
    >
      <div className={cn("h-44 bg-gradient-to-br px-5 py-5 relative overflow-hidden", coverClass)}>
        {book.coverImageUrl && (
          <>
            <img src={book.coverImageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
          </>
        )}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">
              {isSharedBook ? "Shared book" : "Library book"}
            </p>
            <h4 className="mt-3 line-clamp-2 text-xl font-semibold leading-7 text-white">{book.title}</h4>
            {(book.lastReadPage && book.pageCount && book.pageCount > 0) ? (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-white/70 mb-1">
                  <span>Page {book.lastReadPage} of {book.pageCount}</span>
                  <span>{Math.min(100, Math.round((book.lastReadPage / book.pageCount) * 100))}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400" 
                    style={{ width: `${Math.min(100, Math.max(0, (book.lastReadPage / book.pageCount) * 100))}%` }} 
                  />
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] text-white/80">
              {book.fileName.toLowerCase().endsWith(".epub") || book.readingMode === "epub"
                ? `${book.pageCount ?? "—"} ch`
                : book.fileName.toLowerCase().endsWith(".pdf") || book.readingMode === "pdf"
                  ? (book.pageCount && book.pageCount > 0 ? `${book.pageCount}p` : "PDF")
                  : book.fileName.toLowerCase().endsWith(".txt") || book.readingMode === "txt"
                    ? "TXT"
                    : book.readingMode === "text-workspace"
                      ? "TEXT"
                      : (book.pageCount && book.pageCount > 0 ? `${book.pageCount}p` : "BOOK")}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div>
          <p className="truncate text-sm font-medium text-slate-100">{book.fileName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            {book.collectionName ? <span>{book.collectionName}</span> : <span>Unsorted</span>}
            <span>Added {new Date(book.uploadedAt).toLocaleDateString()}</span>
            {book.cefrLevel && <span className="font-bold text-emerald-400">[{book.cefrLevel}]</span>}
            {book.audioUrl && <span className="font-bold text-brand-primary" title="Has Audio Book">AUDIO</span>}
          </div>
          {book.summary && (
            <p className="mt-3 text-xs leading-relaxed text-slate-400 line-clamp-2">{book.summary}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRead}
            disabled={isBookBusy}
            className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Read
          </button>
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              disabled={isBookBusy}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/[0.05] disabled:opacity-50"
            >
              Edit
            </button>
          ) : null}
          {!isSharedBook && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isBookBusy}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/[0.05] disabled:opacity-50"
            >
              Remove
            </button>
          ) : null}
        </div>

        {!isSharedBook ? (
          <div className="flex flex-wrap gap-2">
            {canMoveToCollection && targetCollectionName && onMoveToCollection ? (
              <button
                type="button"
                onClick={onMoveToCollection}
                className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-300/15"
              >
                Move to {targetCollectionName}
              </button>
            ) : null}
            {book.collectionId && onClearCollection ? (
              <button
                type="button"
                onClick={onClearCollection}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.08]"
              >
                Remove from collection
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-xs leading-6 text-slate-400">
            Shared source. Reading is available here; organization changes remain with the owner.
          </p>
        )}
      </div>
    </article>
  )
}

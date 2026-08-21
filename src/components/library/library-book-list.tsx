"use client"

import { Trash2, BookOpen, Edit3 } from "lucide-react"
import type { ReaderLibraryBook } from "@/app/reader/library-storage"
import { cn } from "@/lib/utils"

interface LibraryBookListProps {
  books: ReaderLibraryBook[]
  isBusy: boolean
  onRead: (book: ReaderLibraryBook) => void
  onDelete: (bookId: string) => void
  onEdit?: (book: ReaderLibraryBook) => void
  onShare: (bookId: string) => void
}

const coverClasses = [
  "from-[#18354a] via-[#10283c] to-[#0b1726]",
  "from-[#4a2f18] via-[#302010] to-[#17100a]",
  "from-[#213b31] via-[#122721] to-[#091610]",
  "from-[#3d2234] via-[#251426] to-[#120c15]",
  "from-[#2c3554] via-[#171f38] to-[#0d1221]",
]

function formatFileType(fileName: string) {
  const lower = fileName.toLowerCase()
  if (lower.endsWith(".epub")) return "EPUB"
  if (lower.endsWith(".pdf")) return "PDF"
  if (lower.endsWith(".txt")) return "TXT"
  return "Document"
}

export function LibraryBookList({ books, isBusy, onRead, onDelete, onEdit, onShare }: LibraryBookListProps) {
  if (books.length === 0) return null

  return (
    <div className="mt-6 space-y-2">
      {books.map((book, index) => {
        const coverClass = coverClasses[index % coverClasses.length]
        return (
          <div
            key={book.id}
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div
              className={cn(
                "relative flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white/80 overflow-hidden",
                coverClass,
              )}
            >
              {book.coverImageUrl ? (
                <img src={book.coverImageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
              ) : (
                formatFileType(book.fileName)
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-white">{book.title}</h4>
              <p className="truncate text-xs text-gray-500">
                {book.fileName} · {book.collectionName ?? "Unsorted"} · Added{" "}
                {new Date(book.uploadedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onRead(book)}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Read
              </button>
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(book)}
                  disabled={isBusy}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                  title="Edit book"
                  aria-label="Edit book"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onDelete(book.id)}
                disabled={isBusy}
                className="ml-1 rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                title="Remove book"
                aria-label="Remove book"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

"use client"

import { ReaderLibraryBookCard } from "@/components/reader/reader-library-book-card"
import type { ReaderLibraryBook } from "@/app/reader/library-storage"

interface LibraryBookGridProps {
  books: ReaderLibraryBook[]
  isBusy: boolean
  isLoading: boolean
  onRead: (book: ReaderLibraryBook) => void
  onDelete: (bookId: string) => void
  onEdit?: (book: ReaderLibraryBook) => void
  onShare: (bookId: string) => void
}

export function LibraryBookGrid({
  books,
  isBusy,
  isLoading,
  onRead,
  onEdit,
  onDelete,
  onShare,
}: LibraryBookGridProps) {
  if (isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#07101a] px-5 py-10 text-center text-sm text-slate-300">
        <i className="fas fa-spinner fa-spin mr-2" />
        Loading your library
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-[#07101a] px-6 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300">
          <i className="fas fa-books text-xl" />
        </div>
        <h4 className="mt-5 text-xl font-semibold text-white">No books found</h4>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
          Import a PDF, EPUB, or TXT file to start building your library.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book, index) => (
        <ReaderLibraryBookCard
          key={book.id}
          book={book}
          index={index}
          isActive={false}
          isSharedBook={false}
          isBookBusy={isBusy}
          targetCollectionName={null}
          canMoveToCollection={false}
          onRead={() => onRead(book)}
          onDelete={() => onDelete(book.id)}
          onEdit={onEdit ? () => onEdit(book) : undefined}
          onShare={() => onShare(book.id)}
        />
      ))}
    </div>
  )
}

"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useProjectContext } from "@/contexts/project-context"
import { LibraryWorkspaceScroll } from "@/components/library/library-shell"
import { LibraryToolbar, type LibrarySortKey } from "@/components/library/library-toolbar"
import { LibraryBookGrid } from "@/components/library/library-book-grid"
import { LibraryBookList } from "@/components/library/library-book-list"
import { DeleteBookDialog } from "@/components/library/delete-book-dialog"
import { ReaderLibraryBookCard } from "@/components/reader/reader-library-book-card"
import {
  deleteReaderLibraryBook,
  getReaderLibrary,
  saveReaderLibraryBook,
  uploadDocument,
} from "@/lib/api/media-client"
import { parseEpubBook } from "@/app/reader/epub-package"
import { openPdfDocument, getPdfDisplayTitle } from "@/app/reader/pdf-reader"
import { readerImportTitleFromFileName } from "@/app/reader/reader-import-utils"

import { sortReaderLibraryBooks, type ReaderLibraryBook } from "@/app/reader/library-storage"
import { useMutation } from "@tanstack/react-query"
import { ROUTES } from "@/lib/constants"

export default function LibraryPage() {
  const t = useTranslations("reader")
  const { currentProject } = useProjectContext()
  const router = useRouter()
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [books, setBooks] = useState<ReaderLibraryBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [sort, setSort] = useState<LibrarySortKey>("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const projectId = currentProject?.id ?? ""

  useEffect(() => {
    try {
      const saved = localStorage.getItem("libraryViewMode")
      if (saved === "grid" || saved === "list") {
        setViewMode(saved)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("libraryViewMode", viewMode)
    } catch {
      // ignore
    }
  }, [viewMode])

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!projectId) {
      setBooks([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getReaderLibrary(projectId)
      .then((nextBooks) => {
        if (cancelled) return
        setBooks(sortReaderLibraryBooks(nextBooks))
      })
      .catch((err) => {
        if (cancelled) return
        setBooks([])
        setError(err instanceof Error ? err.message : "Could not load the library.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [projectId])

  const pushSuccessMessage = useCallback((message: string) => {
    setSuccessMessage(message)
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current)
    }
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000)
  }, [])

  const applyBookUpdate = useCallback((book: ReaderLibraryBook) => {
    setBooks((current) => sortReaderLibraryBooks([book, ...current.filter((item) => item.id !== book.id)]))
  }, [])

  const filteredBooks = useMemo(() => {
    let result = [...books]
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) || book.fileName.toLowerCase().includes(query),
      )
    }

    switch (sort) {
      case "added":
        result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        break
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
        break
      case "recent":
      default:
        result = sortReaderLibraryBooks(result)
        break
    }

    return result
  }, [books, searchQuery, sort])

  const uploadBookMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!projectId) {
        throw new Error("Choose a project before uploading books.")
      }

      const nameLower = file.name.toLowerCase()
      const isPdf = file.type === "application/pdf" || nameLower.endsWith(".pdf")
      const isTxt = file.type === "text/plain" || nameLower.endsWith(".txt")
      const isEpub =
        nameLower.endsWith(".epub") ||
        file.type === "application/epub+zip" ||
        file.type === "application/x-epub+zip"

      if (isTxt) {
        try {
          const now = new Date().toISOString()
          const uploaded = await uploadDocument(file)
          const bookId = uploaded.documentId ?? window.crypto.randomUUID()
          const book = await saveReaderLibraryBook(projectId, bookId, {
            title: readerImportTitleFromFileName(file.name),
            fileName: file.name,
            documentId: uploaded.documentId,
            pageCount: 0,
            readingMode: "txt",
            uploadedAt: now,
            lastOpenedAt: now,
          })
          return { mode: "txtLibrary" as const, book }
        } catch (error) {
          throw error
        }
      }

      if (isEpub) {
        const buffer = await file.arrayBuffer()
        const { book: parsed, revokeObjectUrls } = await parseEpubBook(buffer)
        try {
          const now = new Date().toISOString()
          const uploaded = await uploadDocument(file)
          const bookId = uploaded.documentId ?? window.crypto.randomUUID()
          const shelfTitle =
            parsed.title?.trim() && parsed.title.trim().length > 0
              ? parsed.title.trim()
              : readerImportTitleFromFileName(file.name)
          const book = await saveReaderLibraryBook(projectId, bookId, {
            title: shelfTitle,
            fileName: file.name,
            documentId: uploaded.documentId,
            pageCount: parsed.spine.length,
            readingMode: "epub",
            uploadedAt: now,
            lastOpenedAt: now,
          })

          revokeObjectUrls()
          return { mode: "epubLibrary" as const, book }
        } catch (error) {
          revokeObjectUrls()
          throw error
        }
      }

      if (!isPdf) {
        throw new Error("Unsupported format. Use PDF, TXT, or EPUB.")
      }

      const buffer = await file.arrayBuffer()
      const document = await openPdfDocument(buffer)

      try {
        const now = new Date().toISOString()
        const uploaded = await uploadDocument(file)
        const bookId = uploaded.documentId ?? window.crypto.randomUUID()
        const book = await saveReaderLibraryBook(projectId, bookId, {
          title: getPdfDisplayTitle(file.name),
          fileName: file.name,
          documentId: uploaded.documentId,
          pageCount: document.pageCount,
          readingMode: "pdf",
          uploadedAt: now,
          lastOpenedAt: now,
        })

        return { mode: "pdf" as const, book, document }
      } catch (error) {
        await document.destroy().catch(() => undefined)
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.mode === "txtLibrary" || data.mode === "epubLibrary" || data.mode === "pdf") {
        applyBookUpdate(data.book)
        pushSuccessMessage(`Added "${data.book.title}" to your library`)
        router.push(`${ROUTES.READER}?bookId=${encodeURIComponent(data.book.id)}`)
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not import the book.")
    },
  })

  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      if (!projectId) {
        throw new Error("Choose a project before removing books.")
      }
      await deleteReaderLibraryBook(projectId, bookId)
      return bookId
    },
    onSuccess: (bookId) => {
      setBooks((current) => current.filter((item) => item.id !== bookId))
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not remove the book.")
    },
  })

  const [bookToDelete, setBookToDelete] = useState<ReaderLibraryBook | null>(null)

  const isBusy = uploadBookMutation.isPending || deleteBookMutation.isPending || isLoading

  const handleDeleteBook = useCallback(
    (bookId: string) => {
      const target = books.find((item) => item.id === bookId)
      if (target) {
        setBookToDelete(target)
      }
    },
    [books],
  )

  const handleConfirmDelete = useCallback(() => {
    if (!bookToDelete) return
    setError(null)
    deleteBookMutation.mutate(bookToDelete.id, {
      onSettled: () => {
        setBookToDelete(null)
      },
    })
  }, [bookToDelete, deleteBookMutation])

  const handleRead = useCallback(
    (book: ReaderLibraryBook) => {
      router.push(`${ROUTES.READER}?bookId=${encodeURIComponent(book.id)}`)
    },
    [router],
  )

  const handleEdit = useCallback(
    (book: ReaderLibraryBook) => {
      router.push(`${ROUTES.LIBRARY_EDITOR}?bookId=${encodeURIComponent(book.id)}`)
    },
    [router],
  )

  const copyShareLink = useCallback(
    async (bookId: string) => {
      if (typeof window === "undefined" || !projectId) return
      const path = `${ROUTES.READER}?projectId=${encodeURIComponent(projectId)}&bookId=${encodeURIComponent(bookId)}`
      const url = `${window.location.origin}${path}`
      try {
        await navigator.clipboard.writeText(url)
        pushSuccessMessage("Share link copied to clipboard")
      } catch {
        pushSuccessMessage(url)
      }
    },
    [projectId, pushSuccessMessage],
  )

  const noProject = !currentProject

  return (
    <ProtectedRoute>
      <LibraryWorkspaceScroll>
        <div className="relative z-10 mx-auto max-w-[1500px]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur md:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-primary/25 to-brand-secondary/20 text-white">
                <i className="fas fa-book-reader text-lg" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.34em] text-brand-secondary/75">Reader</p>
                <h1 className="text-2xl font-bold text-white md:text-[28px]">{t("library")}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {books.length} book{books.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {noProject ? (
            <div className="rounded-[30px] border border-white/10 bg-[#111723]/90 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <i className="fas fa-book-reader text-4xl text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">{t("selectProject")}</h2>
              <p className="mx-auto mt-2 max-w-xl text-gray-400">
                {t("selectProjectDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.epub,application/pdf,text/plain,application/epub+zip"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    setError(null)
                    uploadBookMutation.mutate(file)
                  }
                  event.currentTarget.value = ""
                }}
              />



              <LibraryToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sort={sort}
                onSortChange={setSort}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                isBusy={isBusy}
                isUploading={uploadBookMutation.isPending}
                onUploadClick={() => fileInputRef.current?.click()}
                onOpenTextWorkspace={() => router.push(ROUTES.LIBRARY_EDITOR)}
                resultCount={filteredBooks.length}
                totalCount={books.length}
              />

              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <section className="min-h-[300px]">
                {viewMode === "grid" ? (
                  <LibraryBookGrid
                    books={filteredBooks}
                    isBusy={isBusy}
                    isLoading={isLoading}
                    onRead={handleRead}
                    onDelete={handleDeleteBook}
                    onEdit={handleEdit}
                    onShare={copyShareLink}
                  />
                ) : (
                  <LibraryBookList
                    books={filteredBooks}
                    isBusy={isBusy}
                    onRead={handleRead}
                    onDelete={handleDeleteBook}
                    onEdit={handleEdit}
                    onShare={copyShareLink}
                  />
                )}
              </section>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg"
            >
              {successMessage}
            </div>
          )}

          <DeleteBookDialog
            book={bookToDelete}
            isOpen={Boolean(bookToDelete)}
            isDeleting={deleteBookMutation.isPending}
            onClose={() => setBookToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        </div>
      </LibraryWorkspaceScroll>
    </ProtectedRoute>
  )
}

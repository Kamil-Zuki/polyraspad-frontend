"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { 
  type TextAnalyzeResponseDto, 
  type SearchTermDuplicatesResponseDto 
} from "@/lib/api/types"
import {
  fetchDocumentBytes,
  saveReaderLibraryBook,
} from "@/lib/api/media-client"
import {
  clientSideTokenize,
  applyTermActionToAnalyzeTokens,
  buildReaderChapters,
  buildReaderContentBlocks,
  findCurrentReaderChapter,
  readerPlainTextFromTokens,
  collectNewWordSurfacesForBulk,
  getBookSourceUrl,
} from "@/app/reader/reader-utils"
import {
  openPdfDocument,
  PDF_PAGE_RENDER_SCALE,
  type PdfDocumentHandle,
  type PdfTextLayerSpan,
} from "@/app/reader/pdf-reader"
import { resolveResumePage, setLocalLastReadPage } from "@/app/reader/reader-progress-local"
import { parseEpubBook, type EpubParsedBook } from "@/app/reader/epub-package"
import { type ReaderLibraryBook } from "@/app/reader/library-storage"
import { buildReaderPages, type ReaderPageSlice } from "@/app/reader/reader-pagination"
import { type PdfViewTab } from "@/app/reader/reader-reading-article"
import { analyticsQueryKeys, readerQueryKeys } from "@/lib/react-query/constants"
import { READER_MARK_KNOWN_PAGE_TURN_KEY } from "@/app/reader/reader-constants"

export type ReaderDocumentKind = "text" | "pdf" | "epub"

export interface UseReaderDocumentProps {
  projectId: string | undefined
  searchParams: URLSearchParams
  resetInspector: () => void
}

export function useReaderDocument({ projectId, searchParams, resetInspector }: UseReaderDocumentProps) {
  const queryClient = useQueryClient()

  const pdfDocumentRef = useRef<PdfDocumentHandle | null>(null)
  const pdfPageTextCacheRef = useRef<Map<number, string>>(new Map())
  const pdfPageAnalysisCacheRef = useRef<Map<number, TextAnalyzeResponseDto>>(new Map())
  const pdfSessionIdRef = useRef(0)
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const epubSessionIdRef = useRef(0)
  const epubBookRef = useRef<EpubParsedBook | null>(null)
  const epubRevokeRef = useRef<(() => void) | null>(null)

  const lastPersistedPageRef = useRef<{ bookId: string; page: number } | null>(null)
  const urlBookHydratedRef = useRef<string | null>(null)
  const lastSyncedSearchRef = useRef<string | null>(null)

  const [rawText, setRawText] = useState("")
  const [result, setResult] = useState<TextAnalyzeResponseDto | null>(null)
  const [sourceTitle, setSourceTitle] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [activeBook, setActiveBook] = useState<ReaderLibraryBook | null>(null)
  const [activeBookId, setActiveBookId] = useState<string | null>(null)

  const [readerError, setReaderError] = useState<string | null>(null)
  const [readerDocumentKind, setReaderDocumentKind] = useState<ReaderDocumentKind>("text")
  const [currentPageNumber, setCurrentPageNumber] = useState(1)
  const [readerPageCount, setReaderPageCount] = useState(0)
  const [isReaderPageLoading, setIsReaderPageLoading] = useState(false)
  const [isReadingMode, setIsReadingMode] = useState(false)

  const [pdfTextLayerSpans, setPdfTextLayerSpans] = useState<PdfTextLayerSpan[]>([])
  const [pdfZoom, setPdfZoom] = useState(1)
  const [pdfViewTab, setPdfViewTab] = useState<PdfViewTab>("split")

  const [markKnownOnPageTurn, setMarkKnownOnPageTurn] = useState(false)
  const [isPageTurnBusy, setIsPageTurnBusy] = useState(false)

  useEffect(() => {
    try {
      setMarkKnownOnPageTurn(localStorage.getItem(READER_MARK_KNOWN_PAGE_TURN_KEY) === "1")
    } catch {
      /* ignore */
    }
  }, [])

  const persistMarkKnownOnPageTurn = useCallback(
    (value: boolean) => {
      setMarkKnownOnPageTurn(value)
      try {
        localStorage.setItem(READER_MARK_KNOWN_PAGE_TURN_KEY, value ? "1" : "0")
      } catch {
        /* ignore */
      }
      queryClient.invalidateQueries({ queryKey: readerQueryKeys.preferences })
    },
    [queryClient]
  )

  const manualPages = useMemo(
    () => (readerDocumentKind === "text" && result ? buildReaderPages(result.tokens) : []),
    [readerDocumentKind, result]
  )
  const hasReadableContent = Boolean(result && result.tokens.length > 0)
  const hasReaderSession = Boolean(
    result ||
      isReaderPageLoading ||
      ((readerDocumentKind === "pdf" || readerDocumentKind === "epub") && activeBookId)
  )

  const totalReaderPages =
    readerDocumentKind === "pdf" || readerDocumentKind === "epub"
      ? readerPageCount > 0
        ? readerPageCount
        : isReaderPageLoading
          ? 1
          : 0
      : manualPages.length > 0
        ? manualPages.length
        : result
          ? 1
          : 0

  const displayedPageNumber =
    totalReaderPages > 0
      ? Math.min(Math.max(currentPageNumber, 1), totalReaderPages)
      : 0

  const activeManualPage = useMemo(() => {
    if (readerDocumentKind !== "text" || !result || manualPages.length === 0) return null
    return manualPages[Math.min(Math.max(currentPageNumber, 1), manualPages.length) - 1] ?? manualPages[0]
  }, [currentPageNumber, manualPages, readerDocumentKind, result])

  const displayedTokenIndexes = useMemo(() => {
    if (!result) return []
    if (readerDocumentKind === "pdf" || readerDocumentKind === "epub") {
      return result.tokens.map((_, index) => index)
    }
    return activeManualPage?.tokenIndexes ?? result.tokens.map((_, index) => index)
  }, [activeManualPage, readerDocumentKind, result])

  const allContentBlocks = useMemo(
    () => (result ? buildReaderContentBlocks(result.tokens) : []),
    [result]
  )

  const readerChapters = useMemo(
    () => buildReaderChapters(allContentBlocks),
    [allContentBlocks]
  )

  const currentReaderChapter = useMemo(
    () => findCurrentReaderChapter(readerChapters, displayedTokenIndexes[0] ?? null),
    [displayedTokenIndexes, readerChapters]
  )

  const chapterPageNumbers = useMemo(() => {
    const pagesByChapter = new Map<string, number>()
    if (readerDocumentKind === "pdf" || readerDocumentKind === "epub") {
      readerChapters.forEach((chapter) => pagesByChapter.set(chapter.id, displayedPageNumber || 1))
      return pagesByChapter
    }
    readerChapters.forEach((chapter) => {
      const page = manualPages.find((item) => item.tokenIndexes.includes(chapter.startTokenIndex))
      if (page) {
        pagesByChapter.set(chapter.id, page.pageNumber)
      }
    })
    return pagesByChapter
  }, [displayedPageNumber, manualPages, readerChapters, readerDocumentKind])

  const currentChapterIndex = currentReaderChapter
    ? readerChapters.findIndex((chapter) => chapter.id === currentReaderChapter.id)
    : -1
  const previousReaderChapter = currentChapterIndex > 0 ? readerChapters[currentChapterIndex - 1] : null
  const nextReaderChapter =
    currentChapterIndex >= 0 && currentChapterIndex < readerChapters.length - 1
      ? readerChapters[currentChapterIndex + 1]
      : null

  const readerDisplayedContentBlocks = useMemo(() => {
    if (!result?.tokens.length) return []
    const visible = new Set(displayedTokenIndexes)
    return allContentBlocks.filter((block) => block.tokenIndexes.some((i) => visible.has(i)))
  }, [allContentBlocks, displayedTokenIndexes, result?.tokens.length])

  const persistReadingProgress = useCallback(
    async (pageNumber: number, bookIdOverride?: string) => {
      const bookId = bookIdOverride ?? activeBookId
      if (!bookId) return

      const safePage = Math.max(1, pageNumber)
      setLocalLastReadPage(bookId, safePage)
      setActiveBook((current) => (current && current.id === bookId ? { ...current, lastReadPage: safePage } : current))

      if (!projectId) return
      const book = activeBook
      if (!book || book.isShared) return

      try {
        const updatedBook = await saveReaderLibraryBook(projectId, bookId, {
          title: book.title,
          fileName: book.fileName,
          documentId: book.documentId,
          pageCount: book.pageCount,
          uploadedAt: book.uploadedAt,
          lastOpenedAt: new Date().toISOString(),
          lastReadPage: safePage,
          collectionId: book.collectionId,
          collectionName: book.collectionName,
          readingMode: book.readingMode,
          hasExtractedText: book.hasExtractedText,
          coverImageUrl: book.coverImageUrl,
          audioUrl: book.audioUrl,
          cefrLevel: book.cefrLevel,
          summary: book.summary,
        })
        setActiveBook(updatedBook)
      } catch {
        /* best-effort resume */
      }
    },
    [activeBook, activeBookId, projectId],
  )

  const destroyPdfSession = useCallback(async () => {
    pdfSessionIdRef.current += 1
    const document = pdfDocumentRef.current
    pdfDocumentRef.current = null
    pdfPageTextCacheRef.current = new Map()
    pdfPageAnalysisCacheRef.current = new Map()
    if (document) {
      try {
        await document.destroy()
      } catch {}
    }
  }, [])

  const destroyEpubSession = useCallback(() => {
    epubSessionIdRef.current += 1
    epubRevokeRef.current?.()
    epubRevokeRef.current = null
    epubBookRef.current = null
    pdfPageAnalysisCacheRef.current = new Map()
  }, [])

  const analyzeTextContent = useCallback(async (text: string) => {
    if (!projectId) {
      return clientSideTokenize(text)
    }
    return apiClient.text.analyze({
      projectId: projectId,
      text,
    })
  }, [projectId])

  const refreshAnalyzeFromCurrentText = useCallback(
    async (merge?: { termNormKey: string; action: "save" | "known" | "ignore" }) => {
      const trimmed = rawText.trim() || readerPlainTextFromTokens(result?.tokens)
      if (!trimmed || !projectId) return

      let refreshed = await analyzeTextContent(trimmed)
      if (merge?.termNormKey) {
        refreshed = applyTermActionToAnalyzeTokens(refreshed, merge.termNormKey, merge.action)
      }
      setResult(refreshed)
      if ((readerDocumentKind === "pdf" || readerDocumentKind === "epub") && displayedPageNumber > 0) {
        pdfPageAnalysisCacheRef.current.set(displayedPageNumber, refreshed)
      }
    },
    [analyzeTextContent, projectId, displayedPageNumber, rawText, readerDocumentKind, result]
  )

  const prefetchPdfPageText = useCallback(async (pageNumber: number, document: PdfDocumentHandle, sessionId: number) => {
    if (pageNumber < 1 || pageNumber > document.pageCount) return
    if (pdfPageTextCacheRef.current.has(pageNumber)) return
    try {
      const pageText = await document.getPageText(pageNumber)
      if (pdfSessionIdRef.current !== sessionId) return
      pdfPageTextCacheRef.current.set(pageNumber, pageText)
    } catch {}
  }, [])

  const loadPdfPage = useCallback(async (pageNumber: number, options?: { document?: PdfDocumentHandle }) => {
    const document = options?.document ?? pdfDocumentRef.current
    if (!document) return

    const safePageNumber = Math.min(Math.max(pageNumber, 1), Math.max(document.pageCount, 1))
    const sessionId = pdfSessionIdRef.current

    setIsReaderPageLoading(true)
    setReaderError(null)
    setCurrentPageNumber(safePageNumber)
    resetInspector()

    try {
      let pageText = pdfPageTextCacheRef.current.get(safePageNumber)
      if (pageText == null) {
        pageText = await document.getPageText(safePageNumber)
        if (pdfSessionIdRef.current !== sessionId) return
        pdfPageTextCacheRef.current.set(safePageNumber, pageText)
      }

      let pageAnalysis = pdfPageAnalysisCacheRef.current.get(safePageNumber)
      if (!pageAnalysis) {
        let computed: TextAnalyzeResponseDto = clientSideTokenize("")
        if (pageText.trim()) {
          const remote = await analyzeTextContent(pageText)
          computed = remote ?? clientSideTokenize(pageText)
        }
        if (pdfSessionIdRef.current !== sessionId) return
        pageAnalysis = computed
        pdfPageAnalysisCacheRef.current.set(safePageNumber, pageAnalysis)
      }

      setRawText(pageText)
      setResult(pageAnalysis)
      setReaderDocumentKind("pdf")
      setReaderPageCount(document.pageCount)
      setCurrentPageNumber(safePageNumber)

      try {
        const spans = await document.getPageTextLayerSpans(safePageNumber, PDF_PAGE_RENDER_SCALE * pdfZoom)
        if (pdfSessionIdRef.current === sessionId) setPdfTextLayerSpans(spans)
      } catch {
        if (pdfSessionIdRef.current === sessionId) setPdfTextLayerSpans([])
      }

      void prefetchPdfPageText(safePageNumber - 1, document, sessionId)
      void prefetchPdfPageText(safePageNumber + 1, document, sessionId)
    } catch (error) {
      if (pdfSessionIdRef.current !== sessionId) return
      setResult(null)
      setRawText("")
      setReaderError(error instanceof Error ? error.message : "Could not load that PDF page.")
    } finally {
      if (pdfSessionIdRef.current === sessionId) {
        setIsReaderPageLoading(false)
      }
    }
  }, [analyzeTextContent, prefetchPdfPageText, resetInspector, pdfZoom])

  const loadEpubChapter = useCallback(
    async (chapterNumber1Based: number) => {
      const book = epubBookRef.current
      if (!book?.spine.length) return

      const spineLen = book.spine.length
      const safeChapter = Math.min(Math.max(chapterNumber1Based, 1), Math.max(spineLen, 1))
      const sessionId = epubSessionIdRef.current

      setIsReaderPageLoading(true)
      setReaderError(null)
      setCurrentPageNumber(safeChapter)
      resetInspector()

      try {
        const chapter = book.spine[safeChapter - 1]
        if (!chapter) {
          throw new Error("EPUB chapter missing.")
        }
        const pageText = chapter.plainTextForAnalyze

        let pageAnalysis = pdfPageAnalysisCacheRef.current.get(safeChapter)
        if (!pageAnalysis) {
          let computed: TextAnalyzeResponseDto = clientSideTokenize("")
          if (pageText.trim()) {
            const remote = await analyzeTextContent(pageText)
            computed = remote ?? clientSideTokenize(pageText)
          }

          if (epubSessionIdRef.current !== sessionId) return

          pageAnalysis = computed
          pdfPageAnalysisCacheRef.current.set(safeChapter, pageAnalysis)
        }

        if (epubSessionIdRef.current !== sessionId) return

        setRawText(pageText)
        setResult(pageAnalysis)
        setReaderDocumentKind("epub")
        setReaderPageCount(spineLen)
        setCurrentPageNumber(safeChapter)
      } catch (error) {
        if (epubSessionIdRef.current !== sessionId) return

        setResult(null)
        setRawText("")
        setReaderError(error instanceof Error ? error.message : "Could not load this EPUB chapter.")
      } finally {
        if (epubSessionIdRef.current === sessionId) {
          setIsReaderPageLoading(false)
        }
      }
    },
    [analyzeTextContent, resetInspector],
  )

  const startEpubSession = useCallback(
    async (params: { book: ReaderLibraryBook; epub: EpubParsedBook; revokeObjectUrls: () => void }) => {
      await destroyPdfSession()

      epubSessionIdRef.current += 1
      epubRevokeRef.current?.()
      epubRevokeRef.current = params.revokeObjectUrls
      epubBookRef.current = params.epub

      pdfPageTextCacheRef.current = new Map()
      pdfPageAnalysisCacheRef.current = new Map()

      lastPersistedPageRef.current = null
      setReaderDocumentKind("epub")
      setReaderPageCount(params.epub.spine.length)
      const resumeChapter = resolveResumePage(params.book, params.epub.spine.length)
      setCurrentPageNumber(resumeChapter)
      setSourceTitle(params.book.title)
      setSourceUrl(getBookSourceUrl(params.book.id, params.book.url))
      setActiveBook(params.book)
      setActiveBookId(params.book.id)
      setResult(null)
      setRawText("")
      setReaderError(null)
      setIsReadingMode(true)
      resetInspector()

      await loadEpubChapter(resumeChapter)
    },
    [destroyPdfSession, loadEpubChapter, resetInspector],
  )

  const startPdfSession = useCallback(async (params: { book: ReaderLibraryBook; document: PdfDocumentHandle }) => {
    await destroyPdfSession()

    epubSessionIdRef.current += 1
    epubRevokeRef.current?.()
    epubRevokeRef.current = null
    epubBookRef.current = null

    pdfSessionIdRef.current += 1
    pdfDocumentRef.current = params.document
    pdfPageTextCacheRef.current = new Map()
    pdfPageAnalysisCacheRef.current = new Map()

    lastPersistedPageRef.current = null
    setReaderDocumentKind("pdf")
    setReaderPageCount(params.document.pageCount)
    const resumePage = resolveResumePage(params.book, params.document.pageCount)
    setCurrentPageNumber(resumePage)
    setSourceTitle(params.book.title)
    setSourceUrl(getBookSourceUrl(params.book.id, params.book.url))
    setActiveBook(params.book)
    setActiveBookId(params.book.id)
    setResult(null)
    setRawText("")
    setReaderError(null)
    setIsReadingMode(true)
    resetInspector()

    await loadPdfPage(resumePage, { document: params.document })
  }, [destroyPdfSession, loadPdfPage, resetInspector])

  const analyzeMutation = useMutation({
    mutationFn: analyzeTextContent,
    onSuccess: (data) => {
      setResult(data)
      setReaderDocumentKind("text")
      setCurrentPageNumber(1)
      setReaderPageCount(0)
      setIsReaderPageLoading(false)
      setIsReadingMode(true)
      resetInspector()
    },
  })

  const loadTextIntoReader = useCallback(
    (params: { text: string; title: string; url?: string; bookId?: string | null }) => {
      void destroyPdfSession()
      destroyEpubSession()

      setRawText(params.text)
      setSourceTitle(params.title)
      setSourceUrl(getBookSourceUrl(params.bookId, params.url))
      setActiveBook(null)
      setActiveBookId(params.bookId ?? null)
      setReaderDocumentKind("text")
      setCurrentPageNumber(1)
      setReaderPageCount(0)
      setIsReaderPageLoading(false)
      setResult(null)
      setReaderError(null)
      resetInspector()

      if (projectId && params.text.trim()) {
        analyzeMutation.mutate(params.text.trim())
      }
    },
    [analyzeMutation, projectId, destroyPdfSession, destroyEpubSession, resetInspector]
  )

  const openBookMutation = useMutation({
    mutationFn: async (book: ReaderLibraryBook) => {
      if (!projectId) {
        throw new Error("Choose a project before opening books.")
      }

      const nameLower = book.fileName.toLowerCase()

      if (nameLower.endsWith(".epub")) {
        const buffer = await fetchDocumentBytes(book.url)
        const { book: epub, revokeObjectUrls } = await parseEpubBook(buffer)
        try {
          if (book.isShared) {
            return { kind: "epub" as const, book, epub, revokeObjectUrls }
          }

          const shelfTitle =
            epub.title?.trim() && epub.title.trim().length > 0 ? epub.title.trim() : book.title.trim() || book.fileName
          const updatedBook = await saveReaderLibraryBook(projectId, book.id, {
            title: shelfTitle,
            fileName: book.fileName,
            documentId: book.documentId,
            pageCount: epub.spine.length,
            uploadedAt: book.uploadedAt,
            lastOpenedAt: new Date().toISOString(),
            lastReadPage: book.lastReadPage,
            collectionId: book.collectionId,
            collectionName: book.collectionName,
            readingMode: book.readingMode || "epub",
            hasExtractedText: book.hasExtractedText,
            coverImageUrl: book.coverImageUrl,
            audioUrl: book.audioUrl,
            cefrLevel: book.cefrLevel,
            summary: book.summary,
          })

          return { kind: "epub" as const, book: updatedBook, epub, revokeObjectUrls }
        } catch (error) {
          revokeObjectUrls()
          throw error
        }
      }
      if (nameLower.endsWith(".txt") || book.readingMode === "txt" || book.readingMode === "text-workspace" || book.readingMode === "text") {
        const buffer = await fetchDocumentBytes(book.url)
        const text = new TextDecoder("utf-8").decode(buffer)
        
        try {
          if (book.isShared) {
            return { kind: "text" as const, book, text }
          }

          const updatedBook = await saveReaderLibraryBook(projectId, book.id, {
            title: book.title,
            fileName: book.fileName,
            documentId: book.documentId,
            pageCount: 0,
            uploadedAt: book.uploadedAt,
            lastOpenedAt: new Date().toISOString(),
            lastReadPage: book.lastReadPage,
            collectionId: book.collectionId,
            collectionName: book.collectionName,
            readingMode: book.readingMode || "text",
            hasExtractedText: book.hasExtractedText,
            coverImageUrl: book.coverImageUrl,
            audioUrl: book.audioUrl,
            cefrLevel: book.cefrLevel,
            summary: book.summary,
          })

          return { kind: "text" as const, book: updatedBook, text }
        } catch (error) {
          throw error
        }
      }

      const document = await openPdfDocument(await fetchDocumentBytes(book.url))

      try {
        if (book.isShared) {
          return { kind: "pdf" as const, book, document }
        }

        const updatedBook = await saveReaderLibraryBook(projectId, book.id, {
          title: book.title,
          fileName: book.fileName,
          documentId: book.documentId,
          pageCount: document.pageCount,
          uploadedAt: book.uploadedAt,
          lastOpenedAt: new Date().toISOString(),
          lastReadPage: book.lastReadPage,
          collectionId: book.collectionId,
          collectionName: book.collectionName,
          readingMode: book.readingMode || "pdf",
          hasExtractedText: book.hasExtractedText,
          coverImageUrl: book.coverImageUrl,
          audioUrl: book.audioUrl,
          cefrLevel: book.cefrLevel,
          summary: book.summary,
        })

        return { kind: "pdf" as const, book: updatedBook, document }
      } catch (error) {
        await document.destroy().catch(() => undefined)
        throw error
      }
    },
    onSuccess: (payload) => {
      if (payload.kind === "text") {
        loadTextIntoReader({
          text: payload.text,
          title: payload.book.title,
          url: payload.book.url,
          bookId: payload.book.id
        })
        return
      }
      if (payload.kind === "epub") {
        void startEpubSession({
          book: payload.book,
          epub: payload.epub,
          revokeObjectUrls: payload.revokeObjectUrls,
        })
        return
      }
      void startPdfSession({ book: payload.book, document: payload.document })
    },
    onError: (error) => {
      setReaderError(error instanceof Error ? error.message : "Could not open the book.")
    },
  })

  return {
    rawText,
    setRawText,
    result,
    setResult,
    sourceTitle,
    setSourceTitle,
    sourceUrl,
    setSourceUrl,
    activeBook,
    setActiveBook,
    activeBookId,
    setActiveBookId,
    readerError,
    setReaderError,
    readerDocumentKind,
    setReaderDocumentKind,
    currentPageNumber,
    setCurrentPageNumber,
    readerPageCount,
    setReaderPageCount,
    isReaderPageLoading,
    setIsReaderPageLoading,
    isReadingMode,
    setIsReadingMode,
    pdfTextLayerSpans,
    setPdfTextLayerSpans,
    pdfZoom,
    setPdfZoom,
    pdfViewTab,
    setPdfViewTab,
    markKnownOnPageTurn,
    persistMarkKnownOnPageTurn,
    isPageTurnBusy,
    setIsPageTurnBusy,
    
    manualPages,
    hasReadableContent,
    hasReaderSession,
    totalReaderPages,
    displayedPageNumber,
    activeManualPage,
    displayedTokenIndexes,
    allContentBlocks,
    readerChapters,
    currentReaderChapter,
    chapterPageNumbers,
    currentChapterIndex,
    previousReaderChapter,
    nextReaderChapter,
    readerDisplayedContentBlocks,
    
    pdfDocumentRef,
    pdfCanvasRef,
    epubBookRef,
    lastPersistedPageRef,
    urlBookHydratedRef,
    lastSyncedSearchRef,
    
    persistReadingProgress,
    destroyPdfSession,
    destroyEpubSession,
    refreshAnalyzeFromCurrentText,
    loadPdfPage,
    loadEpubChapter,
    analyzeMutation,
    loadTextIntoReader,
    openBookMutation,
  }
}

"use client"

import { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect, type MouseEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useProjectContext } from "@/contexts/project-context"
import { useDeckTree, useDeck } from "@/lib/react-query"
import { findDeckIdByTitleInTree, flattenDeckTree } from "@/lib/decks/deck-tree-utils"
import { apiClient } from "@/lib/api"
import { getBcp47LangTag } from "@/hooks/use-browser-tts"
import { analyticsQueryKeys, readerQueryKeys } from "@/lib/react-query/constants"
import { ROUTES } from "@/lib/constants"
import { loadIntegrationPreferences, getEffectiveIntegrationLanguageProfile, resolveCopilotLanguage } from "@/lib/integrations/preferences"
import {
  loadStudyLanguagePair,
  saveStudyLanguagePair,
  normalizeStudyLanguageCode,
  validateDistinctStudyLanguages,
  type StudyLanguagePair,
} from "@/lib/languages/study-language-preferences"
import {
  fetchDocumentBytes,
  getReaderLibrary,
  saveReaderLibraryBook,
  generateAudio,
  formatGenerateAudioUserMessage,
} from "@/lib/api/media-client"
import type {
  TextTokenDto,
  TextAnalyzeResponseDto,
  TextTokenStatus,
  CaptureCardDto,
  NoteFieldValueDto,
  SearchTermDuplicatesResponseDto,
} from "@/lib/api/types"
import { cardPreviewExpression, cardPreviewTranslation, cardPreviewWord } from "@/lib/editor/card-display"
import { fetchMiningDraftClient } from "@/lib/api/ollama-client"
import {
  clientSideTokenize,
  extractSentenceFromTokens,
  buildReaderChapters,
  buildReaderContentBlocks,
  findCurrentReaderChapter,
  readerTermKeyFromToken,
  readerPlainTextFromTokens,
  readerNormalizeSurface,
  applyTermActionToAnalyzeTokens,
  buildReaderDisplaySegments,
  collectNewWordSurfacesForBulk,
  buildPhraseSurfaceFromTokenRange,
  getBookSourceUrl,
  sanitizeSourceUrl,
} from "./reader-utils"

import {
  openPdfDocument,
  PDF_PAGE_RENDER_SCALE,
  type PdfDocumentHandle,
  type PdfTextLayerSpan,
} from "./pdf-reader"
import { findTokenIndexNearCharOffset, type PdfWordHitBox } from "./pdf-overlay-utils"
import { resolveResumePage, setLocalLastReadPage } from "./reader-progress-local"
import { ReaderWordPopover, type ReaderWordPopoverAnchor } from "@/components/reader/reader-word-popover"
import { ReaderInspectorLayout } from "@/components/reader/reader-inspector-layout"
import { ReaderPageTurnZones } from "@/components/reader/reader-page-turn-zones"

import {
  loadReaderReadingTheme,
  saveReaderReadingTheme,
  type ReaderReadingTheme,
} from "@/components/reader/reader-reading-themes"
import { parseEpubBook, type EpubParsedBook } from "./epub-package"
import { type ReaderLibraryBook } from "./library-storage"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { cn } from "@/lib/utils"
import {
  normalizeReaderSearchQuery,
  READER_MARK_KNOWN_PAGE_TURN_KEY,
} from "./reader-constants"
import { buildReaderPages, type ReaderPageSlice } from "./reader-pagination"
import { ReaderReadingArticle, type PdfViewTab } from "./reader-reading-article"
import { ReaderPageInspector } from "./reader-page-inspector"
import { ReaderSessionBookChrome, ReaderSessionPaginationStrip } from "./reader-session-toolbar"
import { ReaderWorkspaceScroll } from "./reader-shell"
import { useReadingTracker } from "@/hooks/use-reading-tracker"

type ReaderDocumentKind = "text" | "pdf" | "epub"

export default function ReaderPage() {
  const { currentProject } = useProjectContext()
  const queryClient = useQueryClient()
  const router = useRouter()

  // Track reading time and report to backend every 5 minutes
  useReadingTracker(currentProject?.id ?? null)
  const searchParams = useSearchParams()
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pdfDocumentRef = useRef<PdfDocumentHandle | null>(null)
  const pdfPageTextCacheRef = useRef<Map<number, string>>(new Map())
  /** Cached analyze result per PDF page or per EPUB spine chapter (1-based index). */
  const pdfPageAnalysisCacheRef = useRef<Map<number, TextAnalyzeResponseDto>>(new Map())
  const pdfSessionIdRef = useRef(0)
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const epubSessionIdRef = useRef(0)
  const epubBookRef = useRef<EpubParsedBook | null>(null)
  const epubRevokeRef = useRef<(() => void) | null>(null)
  const readerAudioInFlightRef = useRef(false)
  const popoverAudioRef = useRef<HTMLAudioElement | null>(null)
  const translationTokenIndexRef = useRef<number | null>(null)
  const phraseSelectionAnchorRef = useRef<number | null>(null)
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
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false)
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false)
  const [wordPopoverAnchor, setWordPopoverAnchor] = useState<ReaderWordPopoverAnchor | null>(null)
  const [readingTheme, setReadingTheme] = useState<ReaderReadingTheme>(() => loadReaderReadingTheme())
  const [pdfTextLayerSpans, setPdfTextLayerSpans] = useState<PdfTextLayerSpan[]>([])
  const [pdfZoom, setPdfZoom] = useState(1)
  const [pdfViewTab, setPdfViewTab] = useState<PdfViewTab>("split")
  const [minedWord, setMinedWord] = useState<{
    word: string
    termText: string | undefined
    sentence: string
    tokenIndex: number
    termType: "WORD" | "PHRASE"
  } | null>(null)
  const [translation, setTranslation] = useState("")
  const [translationError, setTranslationError] = useState<string | null>(null)
  const [sentenceTranslation, setSentenceTranslation] = useState("")
  const [dictionaryLemmaHint, setDictionaryLemmaHint] = useState<string | null>(null)
  const [miningDraftError, setMiningDraftError] = useState<string | null>(null)
  const [transcription, setTranscription] = useState("")
  const [wordTypes, setWordTypes] = useState("")
  const [definition, setDefinition] = useState("")
  const [example, setExample] = useState("")
  const [synonyms, setSynonyms] = useState("")
  const [antonyms, setAntonyms] = useState("")
  const [notes, setNotes] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [dictionaryLookupError, setDictionaryLookupError] = useState<string | null>(null)
  const [inspectorAudioError, setInspectorAudioError] = useState<string | null>(null)
  const [popoverTtsError, setPopoverTtsError] = useState<string | null>(null)
  const [isGeneratingInspectorAudio, setIsGeneratingInspectorAudio] = useState(false)
  const miningDraftTokenRef = useRef<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [duplicateInfo, setDuplicateInfo] = useState<SearchTermDuplicatesResponseDto | null>(null)
  const [markKnownOnPageTurn, setMarkKnownOnPageTurn] = useState(false)
  const [isPageTurnBusy, setIsPageTurnBusy] = useState(false)
  const [studyLangPair, setStudyLangPair] = useState<StudyLanguagePair>(() => loadStudyLanguagePair())
  const [readerCaptureDeckId, setReaderCaptureDeckId] = useState<string>("")

  const projectId = currentProject?.id ?? ""
  const studySourceLang = normalizeStudyLanguageCode(studyLangPair.sourceLanguage) || "en"
  const studyTargetLang = normalizeStudyLanguageCode(studyLangPair.targetLanguage) || "ru"
  const studyLangConflictMessage = validateDistinctStudyLanguages(studyLangPair.sourceLanguage, studyLangPair.targetLanguage)

  const { data: deckTree } = useDeckTree(projectId)
  const flatDecks = useMemo(() => flattenDeckTree(deckTree), [deckTree])
  const inboxDeckId = useMemo(() => findDeckIdByTitleInTree(deckTree, "Inbox"), [deckTree])
  const { data: inboxDeck } = useDeck(inboxDeckId ?? "")
  const sessionReviewHref =
    projectId && inboxDeckId
      ? `/study/${inboxDeckId}/session?returnTo=${encodeURIComponent("/reader")}`
      : null
  const inboxStudySummary = useMemo(() => {
    const stats = inboxDeck?.stats
    if (!stats) return null
    const parts: string[] = []
    if (stats.dueCardsCount > 0) parts.push(`${stats.dueCardsCount} due`)
    if (stats.learningCardsCount > 0) parts.push(`${stats.learningCardsCount} learning`)
    if (stats.newCardsCount > 0) parts.push(`${stats.newCardsCount} new`)
    return parts.length > 0 ? parts.join(" · ") : "caught up"
  }, [inboxDeck?.stats])

  useEffect(() => {
    saveStudyLanguagePair(studyLangPair)
  }, [studyLangPair])

  useLayoutEffect(() => {
    if (!inboxDeckId) return
    setReaderCaptureDeckId((prev) => prev || inboxDeckId)
  }, [inboxDeckId])

  const activeTokenIndex = minedWord?.tokenIndex ?? null
  const activeCollectionName = "Library"
  const manualPages = useMemo(
    () => (readerDocumentKind === "text" && result ? buildReaderPages(result.tokens) : []),
    [readerDocumentKind, result]
  )
  const hasReadableContent = Boolean(result && result.tokens.length > 0)
  const hasReaderSession = Boolean(
    result ||
      isReaderPageLoading ||
      activeBookId
  )
  const resolvedResult = result
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
  const readerDisplaySegments = useMemo(() => {
    if (!result?.tokens.length) return []
    return buildReaderDisplaySegments(
      result.tokens,
      displayedTokenIndexes,
      result.phrases ?? null
    )
  }, [displayedTokenIndexes, result])
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

  const hasReaderStats = Boolean(result?.stats && result.stats.uniqueWords > 0)

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

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!projectId) {
      setResult(null)
      setRawText("")
      setSourceTitle("")
      setSourceUrl("")
      setActiveBook(null)
      setActiveBookId(null)
      setReaderDocumentKind("text")
      setCurrentPageNumber(1)
      setReaderPageCount(0)
      setIsReaderPageLoading(false)
      setIsReadingMode(false)
      setReaderCaptureDeckId("")
      return
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, searchParams, currentProject])

  useEffect(() => {
    if (!projectId) return
    const urlBookId = searchParams.get("bookId")
    // Only redirect if there is NO bookId AND no active session.
    // When bookId is present, the hydration effect below will open the book.
    if (!hasReaderSession && !urlBookId) {
      router.replace(ROUTES.LIBRARY)
    }
  }, [hasReaderSession, projectId, router, searchParams])

  const pushSuccessMessage = useCallback((message: string) => {
    setSuccessMessage(message)
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current)
    }
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000)
  }, [])

  const resetInspector = useCallback(() => {
    translationTokenIndexRef.current = null
    phraseSelectionAnchorRef.current = null
    miningDraftTokenRef.current = null
    setInspectorDrawerOpen(false)
    setWordPopoverAnchor(null)
    setMinedWord(null)
    setTranslation("")
    setTranslationError(null)
    setSentenceTranslation("")
    setDictionaryLemmaHint(null)
    setMiningDraftError(null)
    setTranscription("")
    setWordTypes("")
    setDefinition("")
    setExample("")
    setSynonyms("")
    setAntonyms("")
    setNotes("")
    setImageUrl("")
    setAudioUrl("")
    setDictionaryLookupError(null)
    setInspectorAudioError(null)
    setPopoverTtsError(null)
    popoverAudioRef.current?.pause()
    popoverAudioRef.current = null
    setDuplicateInfo(null)
  }, [])

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
      } catch {
        // Ignore cleanup failures while switching books.
      }
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
    if (!currentProject) {
      return clientSideTokenize(text)
    }

    return apiClient.text.analyze({
      projectId: currentProject.id,
      text,
    })
  }, [currentProject])

  /** Повторный анализ текущего текста после мутаций термина/карточки */
  const refreshAnalyzeFromCurrentText = useCallback(
    async (merge?: { termNormKey: string; action: "save" | "known" | "ignore" }) => {
      const trimmed = rawText.trim() || readerPlainTextFromTokens(result?.tokens)
      if (!trimmed || !currentProject) return

      let refreshed = await analyzeTextContent(trimmed)
      if (merge?.termNormKey) {
        refreshed = applyTermActionToAnalyzeTokens(refreshed, merge.termNormKey, merge.action)
      }
      setResult(refreshed)
      if ((readerDocumentKind === "pdf" || readerDocumentKind === "epub") && displayedPageNumber > 0) {
        pdfPageAnalysisCacheRef.current.set(displayedPageNumber, refreshed)
      }
    },
    [analyzeTextContent, currentProject, displayedPageNumber, rawText, readerDocumentKind, result]
  )

  const prefetchPdfPageText = useCallback(async (pageNumber: number, document: PdfDocumentHandle, sessionId: number) => {
    if (pageNumber < 1 || pageNumber > document.pageCount) return
    if (pdfPageTextCacheRef.current.has(pageNumber)) return

    try {
      const pageText = await document.getPageText(pageNumber)
      if (pdfSessionIdRef.current !== sessionId) return

      pdfPageTextCacheRef.current.set(pageNumber, pageText)
    } catch {
      // Ignore background prefetch failures.
    }
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
  }, [analyzeTextContent, prefetchPdfPageText, resetInspector])

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
      setInspectorDrawerOpen(false)
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

      if (currentProject && params.text.trim()) {
        analyzeMutation.mutate(params.text.trim())
      }
    },
    [analyzeMutation, currentProject, destroyPdfSession, destroyEpubSession, resetInspector]
  )

  const captureMutation = useMutation({
    mutationFn: (data: CaptureCardDto) => apiClient.cards.captureCard(data),
    onSuccess: async (_, variables) => {
      const savedDeckTitle =
        (variables.deckId ? flatDecks.find((d) => d.id === variables.deckId)?.title : undefined) ?? "selected deck"
      pushSuccessMessage(variables.deckId ? `Card saved to ${savedDeckTitle}` : "Card saved")
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] })
      queryClient.invalidateQueries({ queryKey: ["cards"] })
      queryClient.invalidateQueries({ queryKey: ["analytics", "vocabulary", projectId] })
      resetInspector()

      const wordFromPayload =
        variables.fieldValues[SENTENCE_MINING.Word]?.stringValue?.trim() ?? ""
      const normKey = readerNormalizeSurface(wordFromPayload)
      try {
        await refreshAnalyzeFromCurrentText(
          normKey ? { termNormKey: normKey, action: "save" } : undefined
        )
      } catch {
        // Повторный analyze недоступен — подсветка по ключу как после Save.
        setResult((prev) => (prev && normKey ? applyTermActionToAnalyzeTokens(prev, normKey, "save") : prev))
      }
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: (payload: { projectId: string; termText: string; type: "WORD" | "PHRASE" }) =>
      apiClient.terms.searchDuplicates({
        projectId: payload.projectId,
        termText: payload.termText,
        type: payload.type,
      }),
    onSuccess: (data) => setDuplicateInfo(data),
    onError: () => setDuplicateInfo(null),
  })

  const termStatusMutation = useMutation({
    mutationFn: async (action: "save" | "known" | "ignore") => {
      if (!currentProject || !minedWord) {
        throw new Error("Choose a project and a word first.")
      }

      // Surface для ProjectTerm.Text; нормализация для ключей — на сервере (как TermNormalizer).
      const termText = minedWord.word.replace(/\s+/g, " ").trim()
      const language = studySourceLang
      const termType = minedWord.termType
      const baseAction = {
        projectId: currentProject.id,
        termText,
        type: termType,
        language,
      }

      if (action === "known") {
        return apiClient.terms.markKnown(baseAction)
      }
      if (action === "ignore") {
        return apiClient.terms.ignore(baseAction)
      }

      return apiClient.terms.createOrUpdate({
        ...baseAction,
        status: "SAVED",
        meaning: translation.trim() || undefined,
        firstSentence: minedWord.sentence,
        firstSourceTitle: (sourceTitle.trim() || activeBook?.title || "").trim() || undefined,
        firstSourceUrl: sourceUrl.trim() || undefined,
      })
    },
    onSuccess: async (_, action) => {
      const mw = minedWord
      const tokenIdx = mw?.tokenIndex
      const snapshot = result
      const normKey = mw ? readerNormalizeSurface(mw.termText ?? mw.word) : ""

      queryClient.invalidateQueries({ queryKey: ["analytics", "vocabulary", projectId] })
      try {
        await refreshAnalyzeFromCurrentText(
          normKey ? { termNormKey: normKey, action } : undefined
        )
      } catch {
        // Повторный analyze недоступен — обновляем все вхождения с тем же нормализованным ключом.
        if (normKey && snapshot?.tokens?.length) {
          setResult(applyTermActionToAnalyzeTokens(snapshot, normKey, action))
        } else if (snapshot?.tokens?.length && tokenIdx != null && tokenIdx >= 0 && tokenIdx < snapshot.tokens.length) {
          const nextStatus: TextTokenStatus =
            action === "known" ? "KNOWN" : action === "ignore" ? "IGNORED" : "LEARNING"
          const cur = snapshot.tokens[tokenIdx]
          if (cur?.type === "WORD") {
            const updated: TextAnalyzeResponseDto = {
              ...snapshot,
              tokens: [...snapshot.tokens],
            }
            updated.tokens[tokenIdx] = { ...cur, status: nextStatus }
            setResult(updated)
          }
        }
      }
      const msg =
        action === "known"
          ? "Marked as known"
          : action === "ignore"
            ? "Term ignored"
            : "Term saved"
      pushSuccessMessage(msg)
    },
  })

  const translateMutation = useMutation({
    mutationFn: async (payload: { text: string; tokenIndex: number }) => {
      const langErr = validateDistinctStudyLanguages(studyLangPair.sourceLanguage, studyLangPair.targetLanguage)
      if (langErr) {
        throw new Error(langErr)
      }
      const prefs = loadIntegrationPreferences()
      const prof = getEffectiveIntegrationLanguageProfile(prefs, studySourceLang)
      const translated = await apiClient.integrations.translate({
        text: payload.text,
        sourceLanguage: studySourceLang,
        targetLanguage: studyTargetLang,
        provider: prof.translatorProvider,
      })

      return {
        tokenIndex: payload.tokenIndex,
        translatedText: translated.translatedText,
      }
    },
    onSuccess: (data) => {
      setTranslationError(null)
      setTranslation((current) => {
        if (translationTokenIndexRef.current !== data.tokenIndex || current.trim()) {
          return current
        }

        return data.translatedText
      })
    },
    onError: (error) => {
      setTranslationError(error instanceof Error ? error.message : "Translation failed.")
    },
  })

  const miningDraftMutation = useMutation({
    mutationFn: async (payload: { tokenIndex: number; sentence: string; target: string }) => {
      const data = await fetchMiningDraftClient({
        sentence: payload.sentence,
        target: payload.target,
        sourceLanguage: studySourceLang,
        targetLanguage: studyTargetLang,
      })
      return { ...data, tokenIndex: payload.tokenIndex }
    },
    onSuccess: (data) => {
      if (miningDraftTokenRef.current !== data.tokenIndex) return
      setMiningDraftError(null)
      setTranslation(data.targetTranslationInContext)
      setSentenceTranslation(data.sentenceTranslation ?? "")
      setDictionaryLemmaHint(data.dictionaryLemmaHint?.trim() || null)

      const hint = data.dictionaryLemmaHint?.trim()
      if (hint) {
        setNotes((prev) => {
          const line = `(Dictionary lookup hint — base form may be "${hint}" for inflected forms.)`
          if (prev.includes("(Dictionary lookup hint")) return prev
          return prev.trim() ? `${prev}\n\n${line}` : line
        })
      }
    },
    onError: (error) => {
      setMiningDraftError(error instanceof Error ? error.message : "AI mining draft failed.")
    },
  })

  const dictionaryLookupMutation = useMutation({
    mutationFn: async (word: string) => {
      const w = word.replace(/\s+/g, " ").trim()
      if (!w) {
        throw new Error("Pick a word or phrase first.")
      }
      const prefs = loadIntegrationPreferences()
      const prof = getEffectiveIntegrationLanguageProfile(prefs, studySourceLang)
      return apiClient.integrations.lookupDictionary({
        word: w,
        language: studySourceLang,
        provider: prof.dictionaryProvider,
      })
    },
    onSuccess: (lookup) => {
      setDictionaryLookupError(null)
      const topLines = lookup.meanings
        .slice(0, 3)
        .map((meaning) => {
          const sample = meaning.definitions.slice(0, 2).join("; ")
          return meaning.partOfSpeech ? `${meaning.partOfSpeech}: ${sample}` : sample
        })
        .filter(Boolean)

      if (topLines.length === 0) {
        setDictionaryLookupError("No dictionary definitions found for this word.")
        return
      }

      setDefinition(topLines.join("\n"))
      const first = lookup.meanings[0]
      if (first?.partOfSpeech) setWordTypes(first.partOfSpeech)
      if (lookup.phonetic?.trim()) setTranscription(lookup.phonetic.trim())

      const noteChunk = `Dictionary (${lookup.provider}) ${lookup.word}${lookup.phonetic ? ` [${lookup.phonetic}]` : ""}\n${topLines.join("\n")}`
      setNotes((prev) => (prev.trim() ? `${prev}\n\n${noteChunk}` : noteChunk))
    },
    onError: (error) => {
      setDictionaryLookupError(error instanceof Error ? error.message : "Dictionary lookup failed.")
    },
  })

  const generateReaderAudioUrl = useCallback(async (): Promise<string | null> => {
    if (readerAudioInFlightRef.current || !minedWord) return null

    const textForSpeech =
      minedWord.termText?.trim() ||
      minedWord.word.replace(/\s+/g, " ").trim() ||
      minedWord.sentence.trim() ||
      ""

    if (!textForSpeech) {
      throw new Error("Select a word or phrase first.")
    }

    const lang = resolveCopilotLanguage(studySourceLang)
    readerAudioInFlightRef.current = true
    setIsGeneratingInspectorAudio(true)
    try {
      const result = await generateAudio({
        text: textForSpeech.slice(0, 4000),
        language: lang,
      })
      const url = result?.url?.trim() ?? ""
      if (!url) {
        throw new Error(
          "Audio generation returned no URL. Try again or check Media/TTS configuration.",
        )
      }
      setAudioUrl(url)
      return url
    } finally {
      readerAudioInFlightRef.current = false
      setIsGeneratingInspectorAudio(false)
    }
  }, [minedWord, studySourceLang])

  const handleGenerateInspectorAudio = useCallback(async () => {
    setInspectorAudioError(null)
    try {
      await generateReaderAudioUrl()
    } catch (e) {
      setInspectorAudioError(formatGenerateAudioUserMessage(e))
    }
  }, [generateReaderAudioUrl])

  const handlePopoverListen = useCallback(async () => {
    setPopoverTtsError(null)
    const textToSpeak = minedWord?.word || ""
    if (!textToSpeak) return

    const applyTtsSettings = (utt: SpeechSynthesisUtterance) => {
      const bcp = getBcp47LangTag(studySourceLang || currentProject?.targetLang)
      utt.lang = bcp
      const tts = currentProject?.ttsSettings
      utt.rate = tts?.rate ?? 1.0
      utt.pitch = tts?.pitch ?? 1.0
      if (tts?.voiceName && "speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices()
        const match = voices.find((v) => v.name === tts.voiceName)
        if (match) utt.voice = match
      }
    }

    // If AI feature flag is OFF: Server AI TTS is disabled -> use Browser Speech API directly
    if (process.env.NEXT_PUBLIC_FF_AI_AGENTS !== "true") {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(textToSpeak)
          applyTtsSettings(utterance)
          window.speechSynthesis.speak(utterance)
          return
        } catch {
          setPopoverTtsError("Browser speech synthesis failed")
          return
        }
      }
      setPopoverTtsError("Browser speech synthesis is not supported")
      return
    }

    // When AI feature flag is ON: use Server AI TTS
    try {
      const url = await generateReaderAudioUrl()
      if (url) {
        popoverAudioRef.current?.pause()
        const audio = new Audio(url)
        popoverAudioRef.current = audio
        await audio.play()
        return
      }
    } catch {
      // Web Speech API fallback if server AI request fails
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(textToSpeak)
          applyTtsSettings(utterance)
          window.speechSynthesis.speak(utterance)
          return
        } catch {
          // Fallthrough
        }
      }
    }

    setPopoverTtsError("Audio playback failed")
  }, [generateReaderAudioUrl, minedWord?.word, studySourceLang])

  const translateSentenceMutation = useMutation({
    mutationFn: async () => {
      const langErr = validateDistinctStudyLanguages(studyLangPair.sourceLanguage, studyLangPair.targetLanguage)
      if (langErr) {
        throw new Error(langErr)
      }
      const sentenceText = minedWord?.sentence.trim() ?? ""
      if (!sentenceText) throw new Error("No sentence.")
      const prefs = loadIntegrationPreferences()
      const prof = getEffectiveIntegrationLanguageProfile(prefs, studySourceLang)
      const translated = await apiClient.integrations.translate({
        text: sentenceText,
        sourceLanguage: studySourceLang,
        targetLanguage: studyTargetLang,
        provider: prof.translatorProvider,
      })
      return translated.translatedText
    },
    onSuccess: (text) => {
      setTranslationError(null)
      if (text?.trim()) setTranslation(text.trim())
    },
    onError: (error) => {
      setTranslationError(error instanceof Error ? error.message : "Translation failed.")
    },
  })

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
            collectionId: book.collectionId,
            collectionName: book.collectionName,
          })

          return { kind: "epub" as const, book: updatedBook, epub, revokeObjectUrls }
        } catch (error) {
          revokeObjectUrls()
          throw error
        }
      }

      if (nameLower.endsWith(".txt")) {
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
            collectionId: book.collectionId,
            collectionName: book.collectionName,
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
          collectionId: book.collectionId,
          collectionName: book.collectionName,
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
          bookId: payload.book.id,
        })
        setActiveBook(payload.book)
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

  const buildReaderSearch = useCallback(() => {
    if (!projectId) return ""
    const params = new URLSearchParams()
    params.set("projectId", projectId)
    if (activeBookId) {
      params.set("bookId", activeBookId)
    }
    return params.toString()
  }, [projectId, activeBookId])

  useEffect(() => {
    urlBookHydratedRef.current = null
    lastSyncedSearchRef.current = null
  }, [projectId])

  useEffect(() => {
    const urlBookId = searchParams.get("bookId")

    if (!urlBookId || !projectId) return
    if (urlBookHydratedRef.current === urlBookId) return
    if (activeBookId === urlBookId && hasReaderSession) {
      urlBookHydratedRef.current = urlBookId
      if (!isReadingMode) {
        setIsReadingMode(true)
      }
      return
    }

    let cancelled = false
    void getReaderLibrary(projectId)
      .then((libraryBooks) => {
        if (cancelled) return
        const book = libraryBooks.find((item) => item.id === urlBookId)
        if (!book) {
          urlBookHydratedRef.current = urlBookId
          return
        }
        urlBookHydratedRef.current = urlBookId
        openBookMutation.mutate(book)
      })
      .catch(() => {
        if (cancelled) return
        urlBookHydratedRef.current = urlBookId
      })

    return () => {
      cancelled = true
    }
  }, [activeBookId, hasReaderSession, isReadingMode, openBookMutation, projectId, searchParams])

  useEffect(() => {
    if (!projectId) return

    const urlBookId = searchParams.get("bookId")
    // Don't sync the URL while a book from the URL is still being hydrated.
    // Otherwise the bookId can be stripped before openBookMutation starts,
    // which causes the redirect effect to send the user back to /library.
    if (urlBookId && !hasReaderSession) {
      return
    }

    const nextSearch = buildReaderSearch()
    if (!nextSearch) return
    const normalizedNext = normalizeReaderSearchQuery(nextSearch)
    const normalizedCurrent = normalizeReaderSearchQuery(searchParams.toString())
    if (normalizedNext === normalizedCurrent) {
      lastSyncedSearchRef.current = normalizedNext
      return
    }
    if (lastSyncedSearchRef.current === normalizedNext) return
    lastSyncedSearchRef.current = normalizedNext
    router.replace(`/reader?${nextSearch}`, { scroll: false })
  }, [buildReaderSearch, hasReaderSession, projectId, router, searchParams])

  const handleAnalyze = useCallback(() => {
    if (!rawText.trim()) return

    loadTextIntoReader({
      text: rawText,
      title: sourceTitle.trim() || "Library",
      url: sourceUrl,
      bookId: activeBookId,
    })
  }, [loadTextIntoReader, rawText, sourceTitle, sourceUrl, activeBookId])

  const handlePhraseClick = useCallback(
    (phraseText: string, startTokenIndex: number, event?: MouseEvent) => {
      if (!result || !phraseText.trim()) return

      const token = result.tokens[startTokenIndex]
      if (!token) return

      phraseSelectionAnchorRef.current = null
      const sentence = extractSentenceFromTokens(result.tokens, startTokenIndex)
      translationTokenIndexRef.current = startTokenIndex
      setMinedWord({
        word: phraseText.trim(),
        termText: readerNormalizeSurface(phraseText) || undefined,
        sentence,
        tokenIndex: startTokenIndex,
        termType: "PHRASE",
      })
      setTranslation("")
      setTranslationError(null)
      setDuplicateInfo(null)
      setSentenceTranslation("")
      setDictionaryLemmaHint(null)
      setMiningDraftError(null)
      setTranscription("")
      setWordTypes("")
      setDefinition("")
      setExample(sentence)
      setSynonyms("")
      setAntonyms("")
      setNotes("")
      setImageUrl("")
      setAudioUrl("")
      setDictionaryLookupError(null)
      setPopoverTtsError(null)
      if (event) {
        setWordPopoverAnchor({ x: event.clientX, y: event.clientY })
      } else {
        setWordPopoverAnchor({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      }
      translateMutation.mutate({
        text: phraseText.trim(),
        tokenIndex: startTokenIndex,
      })
      miningDraftMutation.mutate({
        tokenIndex: startTokenIndex,
        sentence,
        target: phraseText.trim(),
      })
    },
    [miningDraftMutation, result, translateMutation],
  )

  const handlePhraseDragSelect = useCallback(
    (startIndex: number, endIndex: number) => {
      if (!result) return
      const phraseText = buildPhraseSurfaceFromTokenRange(result.tokens, startIndex, endIndex)
      if (phraseText) handlePhraseClick(phraseText, Math.min(startIndex, endIndex))
    },
    [handlePhraseClick, result],
  )

  const handleTokenClick = useCallback(
    (token: TextTokenDto, index: number, event?: MouseEvent) => {
      if (token.type !== "WORD" || !result) return

      if (event?.shiftKey) {
        const anchor = phraseSelectionAnchorRef.current
        if (anchor != null && anchor !== index) {
          const lo = Math.min(anchor, index)
          const phraseText = buildPhraseSurfaceFromTokenRange(result.tokens, lo, index)
          if (phraseText) {
            phraseSelectionAnchorRef.current = null
            handlePhraseClick(phraseText, lo, event)
            return
          }
        }
        phraseSelectionAnchorRef.current = index
        return
      }

      phraseSelectionAnchorRef.current = null

      const sentence = extractSentenceFromTokens(result.tokens, index)
      translationTokenIndexRef.current = index
      setMinedWord({
        word: token.text,
        termText: readerTermKeyFromToken(token) || undefined,
        sentence,
        tokenIndex: index,
        termType: "WORD",
      })
      setTranslation("")
      setTranslationError(null)
      setDuplicateInfo(null)
      setSentenceTranslation("")
      setDictionaryLemmaHint(null)
      setMiningDraftError(null)
      setTranscription("")
      setWordTypes("")
      setDefinition("")
      setExample(sentence)
      setSynonyms("")
      setAntonyms("")
      setNotes("")
      setImageUrl("")
      setAudioUrl("")
      setDictionaryLookupError(null)
      setPopoverTtsError(null)
      if (event) {
        setWordPopoverAnchor({ x: event.clientX, y: event.clientY })
      } else {
        setWordPopoverAnchor({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      }
      translateMutation.mutate({
        text: token.text,
        tokenIndex: index,
      })
      miningDraftTokenRef.current = index
      miningDraftMutation.mutate({
        tokenIndex: index,
        sentence,
        target: token.text,
      })
    },
    [handlePhraseClick, miningDraftMutation, result, translateMutation],
  )

  const handleMine = useCallback(() => {
    if (!currentProject || !minedWord || !translation.trim() || !readerCaptureDeckId.trim()) return

    const captureTitle = (sourceTitle.trim() || activeBook?.title || "Library").trim()
    const fieldValues: Record<string, NoteFieldValueDto> = {
      [SENTENCE_MINING.Expression]: { stringValue: minedWord.sentence },
      [SENTENCE_MINING.Word]: { stringValue: minedWord.word },
      [SENTENCE_MINING.Translation]: { stringValue: translation.trim() },
      [SENTENCE_MINING.SourceTitle]: { stringValue: captureTitle },
    }

    const pushString = (key: string, v: string) => {
      const t = v.trim()
      if (t) fieldValues[key] = { stringValue: t }
    }

    pushString(SENTENCE_MINING.Transcription, transcription)
    pushString(SENTENCE_MINING.WordTypes, wordTypes)
    pushString(SENTENCE_MINING.Definition, definition)
    pushString(SENTENCE_MINING.Example, example.trim() || minedWord.sentence)
    pushString(SENTENCE_MINING.Antonyms, antonyms)
    pushString(SENTENCE_MINING.Notes, notes)
    pushString(SENTENCE_MINING.Image, imageUrl)
    pushString(SENTENCE_MINING.Audio, audioUrl)

    const synParsed = synonyms
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (synParsed.length > 0) {
      fieldValues[SENTENCE_MINING.Synonyms] = { stringValues: synParsed }
    }

    if (sourceUrl.trim()) {
      fieldValues[SENTENCE_MINING.SourceUrl] = { stringValue: sourceUrl.trim() }
    }

    const payload: CaptureCardDto = {
      projectId: currentProject.id,
      deckId: readerCaptureDeckId,
      fieldValues,
    }

    captureMutation.mutate(payload)
  }, [
    activeBook,
    captureMutation,
    currentProject,
    minedWord,
    readerCaptureDeckId,
    sourceTitle,
    sourceUrl,
    translation,
    transcription,
    wordTypes,
    definition,
    example,
    synonyms,
    antonyms,
    notes,
    imageUrl,
    audioUrl,
  ])

  useEffect(() => {
    return () => {
      void destroyPdfSession()
      destroyEpubSession()
    }
  }, [destroyPdfSession, destroyEpubSession, projectId])

  useEffect(() => {
    if (readerDocumentKind !== "text" || activeTokenIndex == null || manualPages.length === 0) return

    const pageIndex = manualPages.findIndex((page) => page.tokenIndexes.includes(activeTokenIndex))
    if (pageIndex === -1) return

    const nextPageNumber = pageIndex + 1
    setCurrentPageNumber((current) => (current === nextPageNumber ? current : nextPageNumber))
  }, [activeTokenIndex, manualPages, readerDocumentKind])

  useEffect(() => {
    if (totalReaderPages === 0) return

    setCurrentPageNumber((current) => Math.min(Math.max(current, 1), totalReaderPages))
  }, [totalReaderPages])

  useEffect(() => {
    if (!currentProject || !minedWord) return

    duplicateMutation.mutate({
      projectId: currentProject.id,
      termText: minedWord.termText ?? minedWord.word.toLowerCase(),
      type: minedWord.termType,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, minedWord?.word, minedWord?.sentence, minedWord?.termType])

  const handlePdfOverlayWordClick = useCallback(
    (box: PdfWordHitBox) => {
      if (!result?.tokens?.length) return
      const word = box.text.trim()
      if (!word || !/\w/.test(word)) return
      const norm = readerNormalizeSurface(word)
      const idx = findTokenIndexNearCharOffset(result.tokens, norm, box.charStart)
      if (idx >= 0) {
        handleTokenClick(result.tokens[idx]!, idx, {
          clientX: window.innerWidth / 2,
          clientY: window.innerHeight / 2,
        } as MouseEvent)
      }
    },
    [handleTokenClick, result],
  )

  useEffect(() => {
    if (!activeBookId || !hasReaderSession) return
    if (readerDocumentKind !== "pdf" && readerDocumentKind !== "epub") return
    if (currentPageNumber < 1) return

    const last = lastPersistedPageRef.current
    if (last?.bookId === activeBookId && last.page === currentPageNumber) return
    lastPersistedPageRef.current = { bookId: activeBookId, page: currentPageNumber }
    void persistReadingProgress(currentPageNumber, activeBookId)
  }, [
    activeBookId,
    currentPageNumber,
    hasReaderSession,
    persistReadingProgress,
    readerDocumentKind,
  ])

  const goToReaderPage = useCallback(
    async (nextPageNumber: number) => {
      if (totalReaderPages === 0) return

      const safeTarget = Math.min(Math.max(nextPageNumber, 1), totalReaderPages)
      const leaving = displayedPageNumber
      const pageChanged = leaving > 0 && safeTarget !== leaving

      let bulkApplied = false
      if (markKnownOnPageTurn && pageChanged && projectId && currentProject && result) {
        const indexes =
          readerDocumentKind === "pdf" || readerDocumentKind === "epub"
            ? result.tokens.map((_, i) => i)
            : manualPages.find((p) => p.pageNumber === leaving)?.tokenIndexes ?? []
        const surfaces = collectNewWordSurfacesForBulk(result.tokens, indexes)
        if (surfaces.length > 0) {
          setIsPageTurnBusy(true)
          try {
            await apiClient.terms.bulkMarkKnown({
              projectId,
              items: surfaces.map((termText) => ({ termText, type: "WORD" as const })),
              language: studySourceLang,
            })
            queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.vocabularyStats(projectId) })
            queryClient.invalidateQueries({ queryKey: readerQueryKeys.preferences })
            queryClient.invalidateQueries({ queryKey: ["reader"] })
            queryClient.invalidateQueries({ queryKey: ["terms", "list", projectId] })
            bulkApplied = true
          } catch {
            /* best-effort page navigation */
          } finally {
            setIsPageTurnBusy(false)
          }
        }
      }

      if (bulkApplied && (readerDocumentKind === "pdf" || readerDocumentKind === "epub")) {
        pdfPageAnalysisCacheRef.current.clear()
      }
      if (readerDocumentKind === "pdf") {
        await loadPdfPage(safeTarget)
        if (activeBookId) void persistReadingProgress(safeTarget)
        return
      }
      if (readerDocumentKind === "epub") {
        await loadEpubChapter(safeTarget)
        if (activeBookId) void persistReadingProgress(safeTarget)
        return
      }

      resetInspector()

      if (bulkApplied) {
        setIsPageTurnBusy(true)
        try {
          await refreshAnalyzeFromCurrentText()
        } catch {
          /* ignore */
        } finally {
          setIsPageTurnBusy(false)
        }
      }

      setCurrentPageNumber(safeTarget)
    },
    [
      currentProject,
      displayedPageNumber,
      loadEpubChapter,
      loadPdfPage,
      manualPages,
      markKnownOnPageTurn,
      projectId,
      queryClient,
      readerDocumentKind,
      refreshAnalyzeFromCurrentText,
      activeBookId,
      persistReadingProgress,
      resetInspector,
      result,
      studySourceLang,
      totalReaderPages,
    ]
  )

  const goToReaderChapter = useCallback(
    (chapterId: string) => {
      const chapter = readerChapters.find((item) => item.id === chapterId)
      if (!chapter) return

      if (readerDocumentKind === "pdf" || readerDocumentKind === "epub") {
        resetInspector()
        return
      }

      const targetPage = manualPages.find((page) => page.tokenIndexes.includes(chapter.startTokenIndex))
      if (targetPage) {
        void goToReaderPage(targetPage.pageNumber)
      }
    },
    [goToReaderPage, manualPages, readerChapters, readerDocumentKind, resetInspector]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isTextInput =
        target instanceof HTMLElement &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable)

      if (event.key === "Escape" && (minedWord || wordPopoverAnchor)) {
        event.preventDefault()
        resetInspector()
        return
      }

      if (hasReaderSession && !isTextInput) {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          void goToReaderPage(displayedPageNumber - 1)
          return
        }
        if (event.key === "ArrowRight" || (event.key === " " && !minedWord)) {
          event.preventDefault()
          void goToReaderPage(displayedPageNumber + 1)
          return
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        const activeElement = document.activeElement
        const inInput =
          activeElement instanceof HTMLElement &&
          (activeElement.tagName === "TEXTAREA" ||
            activeElement.tagName === "INPUT" ||
            activeElement.isContentEditable)

        if (inInput && !minedWord && rawText.trim() && !analyzeMutation.isPending) {
          event.preventDefault()
          handleAnalyze()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    analyzeMutation.isPending,
    displayedPageNumber,
    goToReaderPage,
    handleAnalyze,
    hasReaderSession,
    minedWord,
    rawText,
    resetInspector,
    wordPopoverAnchor,
  ])

  useEffect(() => {
    if (readerDocumentKind !== "pdf") return
    const doc = pdfDocumentRef.current
    if (!doc || isReaderPageLoading) return

    const pageNum = Math.min(
      Math.max(displayedPageNumber || 1, 1),
      Math.max(doc.pageCount, 1),
    )

    const canvas = pdfCanvasRef.current
    if (!canvas) return
    void doc.renderPageToCanvas(pageNum, canvas, PDF_PAGE_RENDER_SCALE, pdfZoom)
  }, [readerDocumentKind, displayedPageNumber, isReaderPageLoading, result, pdfZoom, pdfViewTab])

  // Custom event listener for Jump To Page
  useEffect(() => {
    const handleGoToPage = (e: Event) => {
      const customEvent = e as CustomEvent<number>
      if (customEvent.detail && typeof customEvent.detail === 'number') {
        void goToReaderPage(customEvent.detail)
      }
    }
    window.addEventListener('reader:goto-page', handleGoToPage)
    return () => window.removeEventListener('reader:goto-page', handleGoToPage)
  }, [goToReaderPage])

  const epubSurfaceHtml = useMemo(() => {
    if (readerDocumentKind !== "epub") return null
    const spine = epubBookRef.current?.spine
    if (!spine?.length || displayedPageNumber < 1) return null
    const ix = Math.min(displayedPageNumber, spine.length) - 1
    return spine[ix]?.bodyInnerHtml ?? null
  }, [readerDocumentKind, displayedPageNumber, result, isReaderPageLoading])

  const readerHeaderSurfaceLabel =
    readerDocumentKind === "pdf"
      ? "PDF page"
      : readerDocumentKind === "epub"
        ? "EPUB chapter"
        : activeBookId
          ? "Library text"
          : "Manual text"

  const noProject = !currentProject
  const isBookBusy = openBookMutation.isPending || isReaderPageLoading

  return (
    <ProtectedRoute>
      <ReaderWorkspaceScroll>
        <div className={`relative z-10 mx-auto ${isReadingMode || hasReaderSession ? "max-w-none" : "max-w-[1500px]"}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur md:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-primary/25 to-brand-secondary/20 text-white">
                <i className="fas fa-book-reader text-lg" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.34em] text-brand-secondary/75">Reader</p>
                <h1 className="text-2xl font-bold text-white md:text-[28px]">
                  {hasReaderSession
                    ? (sourceTitle.trim() || activeBook?.title || "Reading").slice(0, 80)
                    : "Reader"}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
              {hasReaderSession ? (
                <span className="flex max-w-full flex-wrap items-center gap-x-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-gray-200">
                  <span className="text-emerald-200/90">{activeCollectionName}</span>
                  {(sourceTitle.trim() || activeBook?.title) ? (
                    <span className="truncate text-gray-400">
                      · {(sourceTitle.trim() || activeBook?.title || "").slice(0, 44)}
                      {(sourceTitle.trim() || activeBook?.title || "").length > 44 ? "…" : ""}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>

          {noProject ? (
            <div className="rounded-[30px] border border-white/10 bg-[#111723]/90 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <i className="fas fa-book-reader text-4xl text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Select a project</h2>
              <p className="mx-auto mt-2 max-w-xl text-gray-400">
                Choose a project in the sidebar to open the library workspace, build a private collection system, and start mining vocabulary from books.
              </p>
            </div>
          ) : (
            <div
              className={
                hasReaderSession
                  ? "flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5"
                  : "grid gap-5 lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)]"
              }
            >
              <div className={cn("min-w-0 space-y-5", hasReaderSession && "flex-1")}>
                {hasReaderSession ? (
                <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0e1624]/40 shadow-[0_20px_60px_rgba(0,0,0,0.28)] md:rounded-[32px]">
                  <ReaderSessionBookChrome
                    docKind={readerDocumentKind}
                    sourceTitle={sourceTitle}
                    currentProjectTitle={currentProject?.title ?? "Project"}
                    activeCollectionName={activeCollectionName}
                    activeBook={activeBook}
                    currentReaderChapter={currentReaderChapter}
                    isReadingMode={isReadingMode}
                    onBackToLibrary={() => router.push(ROUTES.LIBRARY)}
                    onOpenInspector={() => setInspectorDrawerOpen(true)}
                    onEnterFocusMode={() => setIsReadingMode(true)}
                    sessionReviewHref={sessionReviewHref}
                    inboxStudySummary={inboxStudySummary ?? undefined}
                    hasReaderStats={hasReaderStats}
                    readerStats={result?.stats ?? null}
                    newTermsCount={result?.stats?.newWordsCount}
                    savedTermsCount={result?.stats?.learningWordsCount}
                    activeBookId={activeBookId}
                  />

                  <div className="relative px-3 py-4 md:px-5 md:py-5">
                    <ReaderPageTurnZones
                      enabled={hasReaderSession && totalReaderPages > 1}
                      inspectorOpen={inspectorDrawerOpen}
                      onPrevious={() => void goToReaderPage(displayedPageNumber - 1)}
                      onNext={() => void goToReaderPage(displayedPageNumber + 1)}
                    />
                    <div className="space-y-4 md:space-y-5">
                      <ReaderSessionPaginationStrip
                        docKind={readerDocumentKind}
                        totalReaderPages={totalReaderPages}
                        displayedPageNumber={displayedPageNumber}
                        currentReaderChapter={currentReaderChapter}
                        readerChapters={readerChapters}
                        chapterPageNumbers={chapterPageNumbers}
                        previousReaderChapter={previousReaderChapter}
                        nextReaderChapter={nextReaderChapter}
                        onGoToReaderChapter={goToReaderChapter}
                        markKnownOnPageTurn={markKnownOnPageTurn}
                        onPersistMarkKnownOnPageTurn={persistMarkKnownOnPageTurn}
                        isReaderPageLoading={isReaderPageLoading || analyzeMutation.isPending || openBookMutation.isPending}
                        isPageTurnBusy={isPageTurnBusy}
                        onPreviousPage={() => void goToReaderPage(displayedPageNumber - 1)}
                        onNextPage={() => void goToReaderPage(displayedPageNumber + 1)}
                        onGoToPage={(p) => void goToReaderPage(p)}
                      />

                      <ReaderReadingArticle
                        isReadingMode={isReadingMode}
                        surfaceKind={readerDocumentKind}
                        pdfCanvasRef={pdfCanvasRef}
                        isReaderPageLoading={isReaderPageLoading || analyzeMutation.isPending || openBookMutation.isPending}
                        displayedPageNumber={displayedPageNumber}
                        hasReadableContent={hasReadableContent}
                        libraryError={readerError}
                        readerDisplaySegments={readerDisplaySegments}
                        resolvedTokens={resolvedResult?.tokens}
                        minedWord={minedWord}
                        activeTokenIndex={activeTokenIndex}
                        epubBodyInnerHtml={epubSurfaceHtml}
                        epubAnalysis={readerDocumentKind === "epub" && result ? result : null}
                        epubDisplayedTokenIndexes={displayedTokenIndexes}
                        onTokenClick={handleTokenClick}
                        onPhraseClick={handlePhraseClick}
                        onPhraseDragSelect={handlePhraseDragSelect}
                        pdfTextLayerSpans={pdfTextLayerSpans}
                        pdfZoom={pdfZoom}
                        onPdfZoomChange={setPdfZoom}
                        pdfViewTab={pdfViewTab}
                        onPdfViewTabChange={setPdfViewTab}
                        onPdfOverlayWordClick={handlePdfOverlayWordClick}
                        readingTheme={readingTheme}
                        onReadingThemeChange={(theme) => {
                          setReadingTheme(theme)
                          saveReaderReadingTheme(theme)
                        }}
                        headerSurfaceLabel={readerHeaderSurfaceLabel}
                        footerLeft={activeBook ? activeBook.title : sourceTitle || "Library notes"}
                        contentBlocks={readerDisplayedContentBlocks}
                      />
                      <ReaderWordPopover
                        open={!!minedWord && !!wordPopoverAnchor}
                        anchor={wordPopoverAnchor}
                        word={minedWord?.word ?? ""}
                        translation={translation}
                        transcription={transcription}
                        isTranslationLoading={translateMutation.isPending}
                        pending={termStatusMutation.isPending}
                        onSave={() => termStatusMutation.mutate("save")}
                        onKnown={() => termStatusMutation.mutate("known")}
                        onIgnore={() => termStatusMutation.mutate("ignore")}
                        onOpenDetails={() => {
                          setInspectorDrawerOpen(true)
                          setWordPopoverAnchor(null)
                        }}
                        onListen={() => void handlePopoverListen()}
                        onShadowSentence={() => {
                          if (!minedWord?.sentence) return
                          const params = new URLSearchParams()
                          params.set("sentence", minedWord.sentence)
                          params.set("sourceType", "reader")
                          if (sourceTitle) params.set("sourceTitle", sourceTitle)
                          if (activeBookId) params.set("sourceId", activeBookId)
                          params.set("returnTo", `${window.location.pathname}?${searchParams.toString()}`)
                          router.push(`/shadowing?${params.toString()}`)
                        }}
                        isListenLoading={isGeneratingInspectorAudio}
                        listenError={popoverTtsError}
                        onClose={resetInspector}
                      />
                    </div>
                  </div>
                </section>
                ) : null}
              </div>

              {hasReaderSession ? (
              <ReaderInspectorLayout
                drawerOpen={inspectorDrawerOpen}
                onDrawerClose={() => {
                  setInspectorDrawerOpen(false)
                }}
                showDesktopPanel={inspectorDrawerOpen}
                subtitle={minedWord?.word ?? "Select a word"}
              >
                <ReaderPageInspector
                  isCollapsed={isInspectorCollapsed}
                  onToggleCollapsed={() => setIsInspectorCollapsed((current) => !current)}
                  minedWord={minedWord}
                  projectId={projectId}
                  vocabularyHref={projectId ? "/vocabulary" : null}
                  studyLangPair={studyLangPair}
                  onStudyLangPairChange={setStudyLangPair}
                  studyLangConflictMessage={studyLangConflictMessage}
                  translation={translation}
                  onTranslationChange={setTranslation}
                  translationError={translationError}
                  duplicateInfo={duplicateInfo}
                  duplicatePending={duplicateMutation.isPending}
                  termActionPending={termStatusMutation.isPending}
                  termActionError={termStatusMutation.error}
                  onSaveTerm={() => termStatusMutation.mutate("save")}
                  onKnownTerm={() => termStatusMutation.mutate("known")}
                  onIgnoreTerm={() => termStatusMutation.mutate("ignore")}
                  onGenerateAudio={() => void handleGenerateInspectorAudio()}
                  isGeneratingAudio={isGeneratingInspectorAudio}
                  audioError={inspectorAudioError}
                  onCreateCard={handleMine}
                  createCardPending={captureMutation.isPending}
                  createCardDisabled={
                    !translation.trim() ||
                    captureMutation.isPending ||
                    !readerCaptureDeckId.trim() ||
                    flatDecks.length === 0
                  }
                  captureError={captureMutation.error}
                  readerCaptureDeckId={readerCaptureDeckId}
                  onDeckChange={setReaderCaptureDeckId}
                  flatDecks={flatDecks}
                  sourceUrl={sourceUrl}
                  onClear={resetInspector}
                  resolvedTokens={resolvedResult?.tokens}
                  aiSection={minedWord ? (
                    <>
                          {sentenceTranslation || dictionaryLemmaHint ? (
                            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Model output</p>
                              {sentenceTranslation ? (
                                <p className="mt-2 text-sm leading-6 text-gray-200">
                                  <span className="text-gray-500">Sentence: </span>
                                  {sentenceTranslation}
                                </p>
                              ) : null}
                              {dictionaryLemmaHint ? (
                                <p className="mt-2 text-xs text-gray-500">
                                  Dictionary form (hint only):{" "}
                                  <span className="text-gray-400">{dictionaryLemmaHint}</span>
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">
                              AI suggestions stay hidden until the model replies. Expand any time if you want extra drafts.
                            </p>
                          )}
                          {miningDraftMutation.isPending ? (
                            <p className="text-xs text-cyan-300">
                              <i className="fas fa-spinner fa-spin mr-1.5" />
                              Drafting contextual translation…
                            </p>
                          ) : null}
                          {miningDraftError ? (
                            <p className="text-xs text-gray-400">{miningDraftError}</p>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => translateSentenceMutation.mutate()}
                              disabled={
                                !minedWord?.sentence.trim() ||
                                translateSentenceMutation.isPending ||
                                translateMutation.isPending
                              }
                              className={cn(
                                "rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold transition",
                                translateSentenceMutation.isPending
                                  ? "text-gray-500 border-gray-600"
                                  : "text-brand-secondary hover:bg-brand-secondary/15"
                              )}
                            >
                              {translateSentenceMutation.isPending ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-1.5" />
                                  Sentence…
                                </>
                              ) : (
                                "Translate sentence"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => dictionaryLookupMutation.mutate(minedWord.word)}
                              disabled={dictionaryLookupMutation.isPending || !minedWord.word.trim()}
                              className={cn(
                                "rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold transition",
                                dictionaryLookupMutation.isPending
                                  ? "text-gray-500 border-gray-600"
                                  : "text-brand-primary hover:bg-brand-primary/15"
                              )}
                            >
                              {dictionaryLookupMutation.isPending ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-1.5" />
                                  Dictionary…
                                </>
                              ) : (
                                "Define word"
                              )}
                            </button>
                          </div>
                          {dictionaryLookupError ? (
                            <p className="text-xs text-rose-300">{dictionaryLookupError}</p>
                          ) : null}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => miningDraftMutation.mutate({
                                tokenIndex: minedWord.tokenIndex,
                                sentence: minedWord.sentence,
                                target: minedWord.termText ?? minedWord.word,
                              })}
                              disabled={miningDraftMutation.isPending}
                              className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-semibold text-gray-200 hover:bg-white/5 disabled:opacity-50"
                            >
                              Re-run drafting
                            </button>
                          </div>
                    </>
                  ) : null}
                  advancedCardFields={
                    <>
                      <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Transcription
                            </label>
                            <input
                              type="text"
                              value={transcription}
                              onChange={(e) => setTranscription(e.target.value)}
                              placeholder="IPA / phonetic"
                              className="w-full rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Word types
                            </label>
                            <input
                              type="text"
                              value={wordTypes}
                              onChange={(e) => setWordTypes(e.target.value)}
                              placeholder="noun, phrasal verb…"
                              className="w-full rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Definition
                            </label>
                            <textarea
                              value={definition}
                              onChange={(e) => setDefinition(e.target.value)}
                              placeholder="Dictionary-style definition"
                              rows={3}
                              className="w-full resize-y rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Example / context
                            </label>
                            <textarea
                              value={example}
                              onChange={(e) => setExample(e.target.value)}
                              placeholder="Neighboring lines, extra context…"
                              rows={3}
                              className="w-full resize-y rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Synonyms
                            </label>
                            <input
                              type="text"
                              value={synonyms}
                              onChange={(e) => setSynonyms(e.target.value)}
                              placeholder="Comma-separated"
                              className="w-full rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Antonyms
                            </label>
                            <input
                              type="text"
                              value={antonyms}
                              onChange={(e) => setAntonyms(e.target.value)}
                              placeholder="Comma-separated"
                              className="w-full rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              Notes
                            </label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Grammar notes, AI hints…"
                              rows={3}
                              className="w-full resize-y rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                Image URL
                              </label>
                              <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://…"
                                className="w-full rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                Audio URL
                              </label>
                              <input
                                type="url"
                                value={audioUrl}
                                onChange={(e) => setAudioUrl(e.target.value)}
                                placeholder="https://…"
                                className="w-full rounded-2xl border border-white/10 bg-[#0c1017] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                              />
                            </div>
                          </div>
                    </>
                  }
                />
              </ReaderInspectorLayout>
              ) : null}
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
        </div>
      </ReaderWorkspaceScroll>
    </ProtectedRoute>
  )
}

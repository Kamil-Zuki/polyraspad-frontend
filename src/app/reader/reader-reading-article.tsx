"use client"

import type { MouseEvent, RefObject } from "react"
import { useCallback, useRef, useState } from "react"
import type { TextAnalyzeResponseDto, TextTokenDto } from "@/lib/api/types"
import {
  getTokenStatusClass,
  normalizeReaderTokenStatus,
  type ReaderContentBlock,
  type ReaderRenderSegment,
} from "@/app/reader/reader-utils"
import type { PdfWordHitBox } from "@/app/reader/pdf-overlay-utils"
import type { PdfTextLayerSpan } from "@/app/reader/pdf-reader"
import { EpubChapterBody } from "@/app/reader/epub-chapter-body"
import { PdfPageViewport } from "@/components/reader/pdf-page-viewport"
import { BookOpen } from "lucide-react"
import {
  READER_READING_THEMES,
  loadReaderBookStyle,
  readerReadingThemeClasses,
  saveReaderBookStyle,
  type ReaderReadingTheme,
} from "@/components/reader/reader-reading-themes"
import { cn } from "@/lib/utils"

export type ReaderSurfaceKind = "text" | "pdf" | "epub"

export type PdfViewTab = "split" | "page" | "text" | "overlay"

interface ReaderReadingArticleProps {
  isReadingMode: boolean
  surfaceKind: ReaderSurfaceKind
  pdfCanvasRef: RefObject<HTMLCanvasElement | null>
  isReaderPageLoading: boolean
  displayedPageNumber: number
  hasReadableContent: boolean
  libraryError: string | null
  readerDisplaySegments: ReaderRenderSegment[]
  resolvedTokens: TextTokenDto[] | null | undefined
  minedWord: { termType: "WORD" | "PHRASE"; tokenIndex: number } | null
  activeTokenIndex: number | null
  epubBodyInnerHtml?: string | null
  epubAnalysis?: Pick<TextAnalyzeResponseDto, "tokens" | "phrases"> | null
  epubDisplayedTokenIndexes?: number[]
  onTokenClick: (token: TextTokenDto, index: number, event?: MouseEvent) => void
  onPhraseClick: (text: string, startIndex: number) => void
  onPhraseDragSelect?: (startIndex: number, endIndex: number) => void
  pdfTextLayerSpans?: PdfTextLayerSpan[]
  pdfZoom?: number
  onPdfZoomChange?: (zoom: number) => void
  onPdfOverlayWordClick?: (box: PdfWordHitBox) => void
  readingTheme?: ReaderReadingTheme
  onReadingThemeChange?: (theme: ReaderReadingTheme) => void
  pdfViewTab?: PdfViewTab
  onPdfViewTabChange?: (tab: PdfViewTab) => void
  headerSurfaceLabel: string
  footerLeft: string
  contentBlocks?: ReaderContentBlock[]
}

function PdfViewTabs({
  value,
  onChange,
  hasOverlay,
  themeClasses,
}: {
  value: PdfViewTab
  onChange: (tab: PdfViewTab) => void
  hasOverlay: boolean
  themeClasses: ReturnType<typeof readerReadingThemeClasses>
}) {
  const tabs: { id: PdfViewTab; label: string }[] = [
    { id: "split", label: "Split (page + words)" },
    { id: "page", label: "Page only" },
    { id: "text", label: "Text only" },
  ]
  return (
    <div className="flex flex-wrap gap-2 pb-4" role="tablist" aria-label="PDF view">
      {tabs.map((tab) => {
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={value === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
              value === tab.id
                ? themeClasses.tabActive
                : themeClasses.tabInactive,
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function ReaderReadingArticle({
  isReadingMode,
  surfaceKind,
  pdfCanvasRef,
  isReaderPageLoading,
  displayedPageNumber,
  hasReadableContent,
  libraryError,
  readerDisplaySegments,
  resolvedTokens,
  minedWord,
  activeTokenIndex,
  epubBodyInnerHtml,
  epubAnalysis,
  epubDisplayedTokenIndexes = [],
  onTokenClick,
  onPhraseClick,
  onPhraseDragSelect,
  pdfTextLayerSpans = [],
  onPdfOverlayWordClick,
  pdfZoom,
  onPdfZoomChange,
  readingTheme = "paper",
  onReadingThemeChange,
  pdfViewTab: pdfViewTabProp,
  onPdfViewTabChange,
  headerSurfaceLabel,
  footerLeft,
  contentBlocks = [],
}: ReaderReadingArticleProps) {
  const [localPdfViewTab, setLocalPdfViewTab] = useState<PdfViewTab>("split")
  const pdfViewTab = pdfViewTabProp ?? localPdfViewTab
  const setPdfViewTab = onPdfViewTabChange ?? setLocalPdfViewTab
  const [isBookStyle, setIsBookStyle] = useState<boolean>(() => loadReaderBookStyle())
  const dragStartRef = useRef<number | null>(null)
  const dragEndRef = useRef<number | null>(null)
  const didDragRef = useRef(false)
  const [dragPreview, setDragPreview] = useState<{ start: number; end: number } | null>(null)
  const themeClasses = readerReadingThemeClasses(readingTheme)

  const toggleBookStyle = () => {
    const next = !isBookStyle
    setIsBookStyle(next)
    saveReaderBookStyle(next)
  }

  const segmentHover =
    readingTheme === "dark" ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.05]"
  const activeWordRing = themeClasses.activeWordRing

  const finishDragSelection = useCallback(() => {
    const start = dragStartRef.current
    const end = dragEndRef.current
    dragStartRef.current = null
    dragEndRef.current = null
    setDragPreview(null)
    if (start == null || end == null || !resolvedTokens?.length || !onPhraseDragSelect) return
    const lo = Math.min(start, end)
    const hi = Math.max(start, end)
    if (lo === hi) return
    didDragRef.current = true
    onPhraseDragSelect(lo, hi)
    window.setTimeout(() => {
      didDragRef.current = false
    }, 0)
  }, [onPhraseDragSelect, resolvedTokens?.length])

  function renderSegments(segments: ReaderRenderSegment[], insideBlock = false) {
    const tokens = resolvedTokens
    if (!tokens) return null

    return (
      <>
        {segments.map((segment) => {
          if (segment.type === "phrase") {
            const status = segment.status
            const isActive =
              minedWord?.termType === "PHRASE" &&
              minedWord.tokenIndex === segment.startIndex &&
              activeTokenIndex === segment.startIndex

            return (
              <span
                key={`phrase-${segment.startIndex}-${segment.endIndex}`}
                className={cn(getTokenStatusClass(status, readingTheme), "cursor-pointer transition", segmentHover, isActive && activeWordRing)}
                onClick={() => onPhraseClick(segment.text, segment.startIndex)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onPhraseClick(segment.text, segment.startIndex)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {segment.text}
              </span>
            )
          }

          const tokenIndex = segment.index
          const token = tokens[tokenIndex]
          if (!token) return null
          if (token.type === "SPACE" || token.type === "PUNCTUATION") {
            if (token.text.includes("\n")) {
              if (insideBlock) {
                const displayText = token.text.replace(/\n/g, " ")
                return <span key={tokenIndex}>{displayText}</span>
              }
              return <span key={tokenIndex} className="whitespace-pre-wrap">{token.text}</span>
            }
            return <span key={tokenIndex}>{token.text}</span>
          }

          const status = normalizeReaderTokenStatus(token.status)
          const isActiveWord = activeTokenIndex === tokenIndex
          const inDragRange =
            dragPreview != null &&
            tokenIndex >= dragPreview.start &&
            tokenIndex <= dragPreview.end

          return (
            <span
              key={tokenIndex}
              className={cn(
                getTokenStatusClass(status, readingTheme),
                "cursor-pointer select-none transition",
                segmentHover,
                isActiveWord && activeWordRing,
                inDragRange && "bg-brand-primary/20 ring-1 ring-brand-primary/40",
              )}
              onMouseDown={(e) => {
                if (e.button !== 0) return
                dragStartRef.current = tokenIndex
                dragEndRef.current = tokenIndex
                setDragPreview({ start: tokenIndex, end: tokenIndex })
              }}
              onMouseEnter={() => {
                if (dragStartRef.current == null) return
                dragEndRef.current = tokenIndex
                setDragPreview({
                  start: Math.min(dragStartRef.current, tokenIndex),
                  end: Math.max(dragStartRef.current, tokenIndex),
                })
              }}
              onMouseUp={() => {
                if (dragStartRef.current != null) finishDragSelection()
              }}
              onClick={(e) => {
                if (didDragRef.current) return
                onTokenClick(token, tokenIndex, e)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onTokenClick(token, tokenIndex)
                }
              }}
              role="button"
              tabIndex={0}
            >
              {token.text}
            </span>
          )
        })}
      </>
    )
  }

  function segmentTouchesBlock(segment: ReaderRenderSegment, block: ReaderContentBlock): boolean {
    const inBlock = new Set(block.tokenIndexes)
    if (segment.type === "phrase") return inBlock.has(segment.startIndex)
    return inBlock.has(segment.index)
  }

  const tokenStreamInner =
    hasReadableContent && resolvedTokens?.length ? (
      contentBlocks.length > 0 ? (
        <>
          {contentBlocks.map((block) => {
            const segs = readerDisplaySegments.filter((s) => segmentTouchesBlock(s, block))
            if (!segs.length) return null
            const body = renderSegments(segs, true)
            if (block.type === "heading") {
              return (
                <h3 key={block.id} className={cn("mb-3 mt-6 text-lg font-semibold tracking-tight first:mt-2 md:text-xl font-sans text-balance", themeClasses.text)}>
                  {body}
                </h3>
              )
            }
            if (block.type === "list-item") {
              return (
                <p key={block.id} className={cn("mb-6 border-l-2 pl-4 text-pretty md:pl-5", themeClasses.border, themeClasses.text)}>
                  {body}
                </p>
              )
            }
            return (
              <p key={block.id} className={cn("mb-6 text-pretty leading-[1.75] last:mb-2 md:mb-7 md:leading-[1.85]", themeClasses.text)}>
                {body}
              </p>
            )
          })}
        </>
      ) : (
        renderSegments(readerDisplaySegments)
      )
    ) : null

  const textPanelTextColor = themeClasses.text
  const bookStyleClasses = isBookStyle ? "font-reader book-style" : ""

  const tokenStream =
    surfaceKind === "pdf" || surfaceKind === "epub" ? (
      <div className={cn("min-h-0 flex-1 overflow-y-auto pr-1 text-[16px] leading-8 custom-scroll md:text-[17px] md:leading-9", textPanelTextColor, bookStyleClasses)}>
        {tokenStreamInner}
      </div>
    ) : (
      <div className={cn("mx-auto max-w-[780px] text-[20px] leading-[2.12] md:text-[21px]", textPanelTextColor, bookStyleClasses)}>
        {tokenStreamInner}
      </div>
    )

  const pdfPageViewport = (
    <PdfPageViewport
      canvasRef={pdfCanvasRef}
      pageNumber={displayedPageNumber}
      spans={pdfTextLayerSpans}
      showOverlayLayer={pdfViewTab === "overlay" && pdfTextLayerSpans.length > 0}
      onWordClick={onPdfOverlayWordClick}
      zoom={pdfZoom}
    />
  )

  const isDarkTheme = readingTheme === "dark"
  const panelBg = isDarkTheme ? "bg-white/[0.03]" : "bg-black/[0.03]"
  const panelBorder = isDarkTheme ? "border-white/10" : "border-black/10"

  const textPanelLabel = surfaceKind === "pdf" ? "Transcript" : "Text"
  const extractedTextPanel = hasReadableContent ? (
    <section className={cn("flex min-h-[min(420px,55vh)] flex-col rounded-[22px] border p-3 shadow-inner md:min-h-[min(520px,65vh)] md:p-4 xl:min-h-[min(720px,78vh)]", panelBg, panelBorder)}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.24em]", themeClasses.muted)}>{textPanelLabel}</p>
          <p className={cn("mt-1 text-xs leading-5", themeClasses.muted)}>
            Click or drag across words · Shift+click for phrase range
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]", themeClasses.badgeSky)}>
          tokens
        </span>
      </div>
      {tokenStream}
    </section>
  ) : null

  const renderPdfBody = () => {
    if (isReaderPageLoading) {
      return (
        <div className={cn("flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed text-sm md:min-h-[420px]", panelBg, panelBorder, themeClasses.muted)}>
          <span>
            <i className="fas fa-spinner fa-spin mr-2" />
            Loading page {displayedPageNumber || 1}
          </span>
        </div>
      )
    }

    if (libraryError) {
      return (
        <div role="alert" className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[24px] border border-red-500/30 bg-red-500/5 px-6 py-10 text-center md:min-h-[420px]">
          <p className="text-base font-semibold text-red-400">Could not load this PDF page</p>
          <p className="mt-2 max-w-md text-sm leading-7 text-red-400/80">{libraryError}</p>
        </div>
      )
    }

    if (!hasReadableContent && pdfViewTab !== "page") {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">{pdfPageViewport}</div>
          <div role="status" className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-[24px] border border-sky-500/30 bg-sky-500/5 px-6 py-8 text-center">
            <p className="text-base font-semibold text-sky-400">No extractable text on this page</p>
            <p className="max-w-md text-sm leading-7 text-sky-400/80">
              Scanned or image-only pages have no text layer. Try another page or import EPUB/TXT.
            </p>
          </div>
        </div>
      )
    }

    const showPage = pdfViewTab === "split" || pdfViewTab === "page" || pdfViewTab === "overlay"
    const showText = pdfViewTab === "split" || pdfViewTab === "text"
    const hasOverlay = pdfTextLayerSpans.length > 0

    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <PdfViewTabs value={pdfViewTab} onChange={setPdfViewTab} hasOverlay={hasOverlay} themeClasses={themeClasses} />
        {pdfViewTab === "split" && showPage && showText && extractedTextPanel ? (
          <div className="grid min-h-[min(520px,70vh)] gap-4 lg:grid-cols-[minmax(280px,0.55fr)_minmax(280px,0.45fr)]">
            <div className="flex min-h-0 min-w-0 flex-col">{pdfPageViewport}</div>
            <div className="flex min-h-0 min-w-0 flex-col">{extractedTextPanel}</div>
          </div>
        ) : (
          <div className="grid min-h-0 grid-cols-1 gap-4 md:gap-5">
            {showPage ? <div className="flex min-h-0 flex-col">{pdfPageViewport}</div> : null}
            {showText && extractedTextPanel ? <div className="flex min-h-0 flex-col">{extractedTextPanel}</div> : null}
          </div>
        )}
        {pdfViewTab === "overlay" && hasOverlay ? (
          <p className="text-center text-xs text-gray-500">Hover words on the page · click for translation</p>
        ) : null}
      </div>
    )
  }

  const renderEpubBody = () => {
    if (isReaderPageLoading) {
      return (
        <div className={cn("flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed text-sm md:min-h-[420px]", panelBg, panelBorder, themeClasses.muted)}>
          <span>
            <i className="fas fa-spinner fa-spin mr-2" />
            Loading chapter {displayedPageNumber || 1}
          </span>
        </div>
      )
    }

    if (libraryError) {
      return (
        <div role="alert" className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[24px] border border-red-500/30 bg-red-500/5 px-6 py-10 text-center md:min-h-[420px]">
          <p className="text-base font-semibold text-red-400">Could not load this EPUB chapter</p>
          <p className="mt-2 max-w-md text-sm leading-7 text-red-400/80">{libraryError}</p>
        </div>
      )
    }

    const hasOriginal = Boolean(epubBodyInnerHtml)
    const hasExtracted = hasReadableContent

    if (!hasOriginal) {
      return (
        <div role="status" className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[24px] border border-sky-500/30 bg-sky-500/5 px-6 py-10 text-center md:min-h-[420px]">
          <p className="text-base font-semibold text-sky-400">No rendered chapter content</p>
          <p className="max-w-md text-sm leading-7 text-sky-400/80">
            This EPUB chapter appears to be empty or could not be parsed.
          </p>
        </div>
      )
    }

    const showPage = pdfViewTab === "split" || pdfViewTab === "page" || pdfViewTab === "overlay"
    const showText = pdfViewTab === "split" || pdfViewTab === "text"

    const epubPageViewport = (
      <div className={cn("flex min-h-[min(320px,45vh)] flex-1 flex-col overflow-auto rounded-[22px] border p-3 shadow-inner md:min-h-[min(400px,55vh)] md:p-4", panelBg, panelBorder)}>
        {epubAnalysis && epubBodyInnerHtml ? (
          <EpubChapterBody
            bodyInnerHtml={epubBodyInnerHtml}
            analysis={epubAnalysis}
            displayedTokenIndexes={epubDisplayedTokenIndexes}
            minedTokenIndex={minedWord?.termType === "WORD" ? minedWord.tokenIndex : null}
            minedPhraseStartIndex={minedWord?.termType === "PHRASE" ? minedWord.tokenIndex : null}
            onWordClick={onTokenClick}
            onPhraseClick={onPhraseClick}
            readingTheme={readingTheme}
            isBookStyle={isBookStyle}
          />
        ) : null}
      </div>
    )

    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <PdfViewTabs value={pdfViewTab} onChange={setPdfViewTab} hasOverlay={false} themeClasses={themeClasses} />
        {pdfViewTab === "split" && showPage && showText && extractedTextPanel ? (
          <div className="grid min-h-[min(520px,70vh)] gap-4 lg:grid-cols-[minmax(280px,0.55fr)_minmax(280px,0.45fr)]">
            <div className="flex min-h-0 min-w-0 flex-col">{epubPageViewport}</div>
            <div className="flex min-h-0 min-w-0 flex-col">{extractedTextPanel}</div>
          </div>
        ) : (
          <div className="grid min-h-0 grid-cols-1 gap-4 md:gap-5">
            {showPage ? <div className="flex min-h-0 flex-col">{epubPageViewport}</div> : null}
            {showText && extractedTextPanel ? <div className="flex min-h-0 flex-col">{extractedTextPanel}</div> : null}
          </div>
        )}
      </div>
    )
  }

  return (
    <article
      className={cn(
        "relative w-full overflow-hidden rounded-[24px] border p-3 shadow-[0_18px_42px_rgba(84,57,30,0.09)] md:rounded-[28px] md:p-5",
        themeClasses.plate,
        isReadingMode ? "mx-auto max-w-none" : "mx-auto max-w-[980px]",
      )}
      onMouseLeave={() => {
        if (dragStartRef.current != null) finishDragSelection()
      }}
    >
      {readingTheme === "paper" ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),rgba(255,255,255,0)_42%)]" />
          <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-6 bg-[linear-gradient(90deg,rgba(123,92,58,0.12),transparent)] md:block" />
        </>
      ) : null}
      <div className="relative flex h-full flex-col">
        <div className={cn("flex flex-wrap items-center justify-between gap-2 border-b pb-3", themeClasses.border)}>
          <span className={cn("text-[11px] uppercase tracking-[0.32em]", themeClasses.muted)}>{headerSurfaceLabel}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleBookStyle}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
                isBookStyle
                  ? themeClasses.bookStyleActive
                  : cn("border-transparent hover:bg-black/5", themeClasses.muted),
              )}
              title="Форматирование текста как в книге (Serif, выравнивание по ширине, красная строка)"
            >
              <BookOpen className="h-3 w-3" />
              <span>Книжный стиль</span>
            </button>
            {onReadingThemeChange ? (
              <div className="flex gap-1" role="group" aria-label="Reading theme">
                {READER_READING_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onReadingThemeChange(t.id)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
                      readingTheme === t.id
                        ? themeClasses.tabActive
                        : cn("hover:bg-black/5", themeClasses.muted),
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : null}
            <span className={cn("text-sm font-medium", themeClasses.muted)}>Page {displayedPageNumber || 1}</span>
            {surfaceKind === "pdf" && onPdfZoomChange ? (
              <div className="flex items-center gap-1" role="group" aria-label="PDF zoom">
                <button
                  type="button"
                  onClick={() => onPdfZoomChange(Math.max(0.5, (pdfZoom ?? 1) - 0.1))}
                  className={cn(
                    "rounded-full border px-2 py-1 text-xs transition",
                    themeClasses.border,
                    themeClasses.muted,
                    isDarkTheme ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
                  )}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <span className={cn("min-w-[3ch] text-center text-xs font-medium", themeClasses.muted)}>
                  {Math.round((pdfZoom ?? 1) * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => onPdfZoomChange(Math.min(3, (pdfZoom ?? 1) + 0.1))}
                  className={cn(
                    "rounded-full border px-2 py-1 text-xs transition",
                    themeClasses.border,
                    themeClasses.muted,
                    isDarkTheme ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
                  )}
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 pt-4 md:space-y-6 md:pt-5">
          {surfaceKind === "pdf" ? renderPdfBody() : null}
          {surfaceKind === "epub" ? renderEpubBody() : null}
          {surfaceKind === "text" ? (
            isReaderPageLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed text-sm">
                <span>
                  <i className="fas fa-spinner fa-spin mr-2" />
                  Loading…
                </span>
              </div>
            ) : hasReadableContent ? (
              tokenStream
            ) : (
              <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed px-6 text-center text-sm">
                This text page is empty.
              </div>
            )
          ) : null}
        </div>

        <div className={cn("mt-6 flex items-center justify-between border-t pt-3 text-xs uppercase tracking-[0.25em] md:mt-8", themeClasses.border, themeClasses.muted)}>
          <span className="truncate">{footerLeft}</span>
          <span>{displayedPageNumber || 1}</span>
        </div>
      </div>
    </article>
  )
}

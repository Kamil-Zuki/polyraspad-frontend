"use client"

import { useEffect, useRef } from "react"
import type { TextAnalyzeResponseDto, TextTokenDto } from "@/lib/api/types"
import { buildReaderDisplaySegments, getTokenStatusClass, normalizeReaderTokenStatus } from "@/app/reader/reader-utils"
import {
  linearizeBodyTextNodes,
  charRangeToDomRange,
} from "@/app/reader/epub-package"

export function concatTokensPlainText(tokens: TextTokenDto[]): string {
  return tokens.map((t) => t.text).join("")
}

export function tokenRangeToPlainOffsets(
  tokens: TextTokenDto[],
  startIndex: number,
  endIndex: number,
): { start: number; end: number } {
  const lo = Math.min(startIndex, endIndex)
  const hi = Math.max(startIndex, endIndex)
  let start = 0
  for (let i = 0; i < lo; i++) start += tokens[i]?.text.length ?? 0
  let end = start
  for (let i = lo; i <= hi; i++) end += tokens[i]?.text.length ?? 0
  return { start, end }
}

interface EpubChapterBodyProps {
  bodyInnerHtml: string
  analysis: Pick<TextAnalyzeResponseDto, "tokens" | "phrases">
  /** Usually all token indexes on this spine item */
  displayedTokenIndexes: number[]
  minedTokenIndex: number | null
  minedPhraseStartIndex: number | null
  onWordClick: (token: TextTokenDto, tokenIndex: number) => void
  onPhraseClick: (text: string, startIndex: number) => void
  readingTheme?: "paper" | "sepia" | "dark"
  isBookStyle?: boolean
}

/**
 * Sanitized spine HTML plus vocabulary highlights; clicks map back to analyzer token indexes.
 */
export function EpubChapterBody({
  bodyInnerHtml,
  analysis,
  displayedTokenIndexes,
  minedTokenIndex,
  minedPhraseStartIndex,
  onWordClick,
  onPhraseClick,
  readingTheme = "paper",
  isBookStyle = true,
}: EpubChapterBodyProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const bookStyleClass = isBookStyle ? "font-reader book-style" : ""
    root.innerHTML = `<div class="epub-root reader-epub-root ${bookStyleClass}">${bodyInnerHtml}</div>`

    const inner = root.querySelector(".epub-root") as HTMLElement | null
    if (!inner) return

    const tokens = analysis.tokens ?? []
    const plain = concatTokensPlainText(tokens)
    const { text: linear, segments } = linearizeBodyTextNodes(inner)

    /** Allow minor whitespace normalization mismatch */
    const norm = (s: string) => s.replace(/\u00a0/g, " ").replace(/\s+/g, "")
    const safe =
      plain.length === 0 ||
      norm(linear) === norm(plain) ||
      linear.replace(/\u00a0/g, " ").trim() === plain.replace(/\u00a0/g, " ").trim()

    if (!safe) {
      return
    }

    const segs = buildReaderDisplaySegments(
      tokens,
      displayedTokenIndexes,
      analysis.phrases ?? null,
    )

    type WrapJob = {
      start: number
      end: number
      wrapClass: string
      kind: "phrase" | "word"
      tokenIndex: number
      phraseLabel?: string
    }

    const jobs: WrapJob[] = []

    for (const s of segs) {
      if (s.type === "phrase") {
        const off = tokenRangeToPlainOffsets(tokens, s.startIndex, s.endIndex)
        jobs.push({
          start: off.start,
          end: off.end,
          wrapClass: `${getTokenStatusClass(s.status, readingTheme)} cursor-pointer epub-reader-phrase hover:opacity-90`,
          kind: "phrase",
          tokenIndex: s.startIndex,
          phraseLabel: s.text,
        })
        continue
      }

      const token = tokens[s.index]
      if (!token || token.type !== "WORD") continue
      const lo = tokenRangeToPlainOffsets(tokens, s.index, s.index)
      jobs.push({
        start: lo.start,
        end: lo.end,
        wrapClass: `${getTokenStatusClass(normalizeReaderTokenStatus(token.status), readingTheme)} cursor-pointer epub-reader-word hover:bg-white/30`,
        kind: "word",
        tokenIndex: s.index,
      })
    }

    jobs.sort((a, b) => b.start - a.start)

    for (const job of jobs) {
      const { text: t2, segments: seg2 } = linearizeBodyTextNodes(inner)
      if (!t2) continue
      if (norm(t2) !== norm(plain) && t2.replace(/\u00a0/g, " ").trim() !== plain.replace(/\u00a0/g, " ").trim()) {
        break
      }

      const range = charRangeToDomRange(seg2, job.start, job.end)
      if (!range) continue

      try {
        const el = document.createElement(job.kind === "phrase" ? "span" : "span")
        el.className = job.wrapClass
        el.dataset.epubInteract = job.kind
        el.dataset.tokenIndex = String(job.tokenIndex)
        if (job.kind === "phrase") {
          el.tabIndex = 0
          el.setAttribute("role", "button")
        } else {
          el.tabIndex = 0
          el.setAttribute("role", "button")
        }

        range.surroundContents(el)

        el.addEventListener("click", (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          if (job.kind === "phrase") {
            onPhraseClick(job.phraseLabel ?? "", job.tokenIndex)
          } else {
            const tk = tokens[job.tokenIndex]
            if (tk) onWordClick(tk, job.tokenIndex)
          }
        })

        el.addEventListener("keydown", (ev) => {
          if (ev.key !== "Enter" && ev.key !== " ") return
          ev.preventDefault()
          if (job.kind === "phrase") {
            onPhraseClick(job.phraseLabel ?? "", job.tokenIndex)
          } else {
            const tk = tokens[job.tokenIndex]
            if (tk) onWordClick(tk, job.tokenIndex)
          }
        })
      } catch {
        /* surroundContents fails across element boundaries — skip fragment */
      }
    }

    const applyActiveRing = () => {
      inner.querySelectorAll("[data-epub-active]").forEach((node) => {
        node.removeAttribute("data-epub-active")
        node.classList.remove("ring-2", "ring-brand-primary/70", "bg-brand-primary/15")
      })
      const hit =
        minedPhraseStartIndex != null
          ? `span[data-epub-interact="phrase"][data-token-index="${minedPhraseStartIndex}"]`
          : minedTokenIndex != null
            ? `span[data-epub-interact="word"][data-token-index="${minedTokenIndex}"]`
            : null
      if (!hit) return
      const el = inner.querySelector(hit)
      if (el instanceof HTMLElement) {
        el.dataset.epubActive = "1"
        el.classList.add("ring-2", "ring-brand-primary/70", "bg-brand-primary/15")
      }
    }

    applyActiveRing()

    return () => {
      root.innerHTML = ""
    }
  }, [
    bodyInnerHtml,
    analysis,
    displayedTokenIndexes,
    minedTokenIndex,
    minedPhraseStartIndex,
    onWordClick,
    onPhraseClick,
  ])

  return (
    <div
      ref={rootRef}
      className="reader-epub-chapter max-w-none text-[#2a2115] selection:bg-amber-200/50 [&_.reader-epub-root]:leading-relaxed [&_.reader-epub-root_p]:my-4 [&_.reader-epub-root_h1]:mb-6 [&_.reader-epub-root_h1]:mt-10 [&_.reader-epub-root_h1]:text-4xl [&_.reader-epub-root_h2]:mb-5 [&_.reader-epub-root_h2]:mt-10 [&_.reader-epub-root_h2]:text-3xl [&_.reader-epub-root_h3]:mb-4 [&_.reader-epub-root_h3]:mt-9 [&_.reader-epub-root_h3]:text-2xl [&_.reader-epub-root_img]:my-6 [&_.reader-epub-root_img]:max-h-[520px] [&_.reader-epub-root_img]:w-auto [&_.reader-epub-root_img]:max-w-full [&_.reader-epub-root_figure]:mx-auto [&_.reader-epub-root_figure]:my-10 [&_.reader-epub-root_figure]:text-center [&_.reader-epub-root_blockquote]:my-9 [&_.reader-epub-root_blockquote]:border-l-[4px] [&_.reader-epub-root_blockquote]:border-[#cfb796]/80 [&_.reader-epub-root_blockquote]:pl-8 [&_.reader-epub-root_blockquote]:text-[1.06em] [&_.reader-epub-root_li]:my-4 [&_.reader-epub-root_ul]:my-10 [&_.reader-epub-root_ol]:my-10"
    />
  )
}

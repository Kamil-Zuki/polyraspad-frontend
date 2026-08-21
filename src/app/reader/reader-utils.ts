import type {
  TextAnalyzeResponseDto,
  TextPhraseDto,
  TextTokenDto,
  TextTokenStatus,
} from "@/lib/api/types"

/**
 * Aggregator/System.Text.Json часто отдаёт enum токена числом (0=NEW … 3=IGNORED).
 * Приводим к строкам UI, чтобы подсветка и bulk page-turn совпадали с сервером.
 */
export function normalizeReaderTokenStatus(status: unknown): TextTokenStatus {
  if (status === 0 || status === "0") return "NEW"
  if (status === 1 || status === "1") return "LEARNING"
  if (status === 2 || status === "2") return "KNOWN"
  if (status === 3 || status === "3") return "IGNORED"
  const u = String(status ?? "").toUpperCase()
  if (u === "NEW" || u === "TOKEN_STATUS_NEW") return "NEW"
  if (u === "LEARNING" || u === "SAVED" || u === "LINGQ" || u === "TOKEN_STATUS_LEARNING") return "LEARNING"
  if (u === "KNOWN" || u === "TOKEN_STATUS_KNOWN") return "KNOWN"
  if (u === "IGNORED" || u === "TOKEN_STATUS_IGNORED") return "IGNORED"
  if (u === "NONE" || u === "") return "NONE"
  return "NONE"
}

/**
 * Ключ lookup как у VocabularyService.TermNormalizer: trim, lower, схлопывание \s+ в один пробел.
 */
export function readerNormalizeSurface(input: string | null | undefined): string {
  if (input == null) return ""
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return ""
  return trimmed.replace(/\s+/g, " ")
}

/** Ключ термина для вызовов API и сопоставления с ответом analyze */
export function readerTermKeyFromToken(token: TextTokenDto): string {
  if (token.type !== "WORD") return ""
  return readerNormalizeSurface(token.termText ?? token.text)
}

/** После мутации термина подмешиваем ожидаемый статус в токены с тем же нормализованным ключом */
export function applyTermActionToAnalyzeTokens(
  data: TextAnalyzeResponseDto,
  normKey: string,
  action: "save" | "known" | "ignore"
): TextAnalyzeResponseDto {
  if (!normKey) return data
  const nextStatus: TextTokenStatus =
    action === "save" ? "LEARNING" : action === "known" ? "KNOWN" : "IGNORED"
  let changed = false
  const tokens = data.tokens.map((t) => {
    if (t.type !== "WORD") return t
    if (readerNormalizeSurface(t.termText ?? t.text) !== normKey) return t
    changed = true
    return { ...t, status: nextStatus }
  })
  return changed ? { ...data, tokens } : data
}

/** Восстанавливает исходную строку из ответа анализа (для повторного POST /analyze, если textarea пустая). */
export function readerPlainTextFromTokens(tokens: TextTokenDto[] | undefined | null): string {
  if (!tokens?.length) return ""
  return tokens.map((t) => t.text).join("")
}

export type ReaderContentBlockType = "heading" | "paragraph" | "list-item"

export interface ReaderContentBlock {
  id: string
  type: ReaderContentBlockType
  tokenIndexes: number[]
  text: string
  chapterId?: string
}

export interface ReaderChapter {
  id: string
  title: string
  startTokenIndex: number
  blockId: string
}

export function getTokenStatusClass(
  status: TextTokenStatus | undefined | null | unknown,
  theme: "paper" | "sepia" | "dark" = "paper"
): string {
  const norm = normalizeReaderTokenStatus(status)
  if (theme === "dark") {
    switch (norm) {
      case "NEW":
        return "rounded-[2px] border-b border-sky-400/40 bg-sky-500/15 px-px text-sky-200 cursor-pointer transition"
      case "LEARNING":
        return "rounded-[2px] border-b-2 border-amber-500/40 bg-amber-500/15 px-px text-amber-200 cursor-pointer transition"
      case "KNOWN":
        return "text-slate-200"
      case "IGNORED":
        return "text-slate-500"
      default:
        return "text-slate-400"
    }
  } else if (theme === "sepia") {
    switch (norm) {
      case "NEW":
        return "rounded-[2px] border-b border-sky-600/45 bg-sky-500/15 px-px text-[#0a2038] cursor-pointer transition"
      case "LEARNING":
        return "rounded-[2px] border-b-2 border-amber-600/60 bg-amber-500/20 px-px text-[#4a2600] font-medium cursor-pointer transition"
      case "KNOWN":
        return "text-[#2e2317]"
      case "IGNORED":
        return "text-[#7c6d5b]/80"
      default:
        return "text-[#5e4d3a]"
    }
  } else {
    switch (norm) {
      case "NEW":
        return "rounded-[2px] border-b border-sky-500/45 bg-sky-500/14 px-px text-[#0b2545] cursor-pointer transition"
      case "LEARNING":
        return "rounded-[2px] border-b-2 border-amber-600/60 bg-amber-500/20 px-px text-[#4a2600] font-medium cursor-pointer transition"
      case "KNOWN":
        return "text-[#231b13]"
      case "IGNORED":
        return "text-[#7c6d5b]/75"
      default:
        return "text-[#5e4d3a]"
    }
  }
}

/** Client-side fallback when /text/analyze API is not available: split into words/spaces/punctuation, all words NEW */
export function clientSideTokenize(text: string): TextAnalyzeResponseDto {
  const tokens: TextTokenDto[] = []
  const re = /(\s+|[^\s\w]+|\w+)/g
  let m: RegExpExecArray | null
  const uniqueWords = new Set<string>()
  while ((m = re.exec(text)) !== null) {
    const t = m[0]
    if (/^\s+$/.test(t)) {
      tokens.push({ text: t, type: "SPACE", status: "NONE" })
    } else if (/^\w+$/.test(t)) {
      const termText = readerNormalizeSurface(t)
      uniqueWords.add(termText)
      tokens.push({ text: t, termText, status: "NEW", type: "WORD" })
    } else {
      tokens.push({ text: t, type: "PUNCTUATION", status: "NONE" })
    }
  }
  return {
    tokens,
    stats: {
      uniqueWords: uniqueWords.size,
      knownPercentage: 0,
    },
  }
}

export function extractSentenceFromTokens(
  tokens: TextTokenDto[],
  wordIndex: number
): string {
  const isSentenceEnd = (t: TextTokenDto) =>
    t.type === "PUNCTUATION" && /[.!?]/.test(t.text)
  let start = wordIndex
  while (start > 0) {
    start--
    if (isSentenceEnd(tokens[start])) {
      start++
      break
    }
  }
  let end = wordIndex
  while (end < tokens.length - 1) {
    end++
    if (isSentenceEnd(tokens[end])) break
  }
  return tokens
    .slice(start, end + 1)
    .map((t) => t.text)
    .join("")
}

function getBlockText(tokens: TextTokenDto[], tokenIndexes: number[]) {
  return tokenIndexes
    .map((index) => tokens[index]?.text ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim()
}

function isParagraphBreak(token: TextTokenDto) {
  return token.type === "SPACE" && /\n\s*\n/.test(token.text)
}

function isSoftLineBreak(token: TextTokenDto) {
  return token.type === "SPACE" && /\n/.test(token.text)
}

function classifyBlock(text: string): ReaderContentBlockType {
  const normalized = text.trim()
  if (!normalized) return "paragraph"
  const words = normalized.split(/\s+/).filter(Boolean)

  if (/^(?:#{1,6}\s*)?(chapter|part|book|section|preface|foreword|introduction|prologue|epilogue|acknowledgements|contents|table of contents|index|summary|overview)\s*[\divxlc0-9]*(?:\b|[:.\-\/])/i.test(normalized)) {
    return "heading"
  }

  if (/^(?:#{1,6}\s*)?(prologue|epilogue|introduction|foreword|afterword|preface|acknowledgements|contents|index|summary|overview)\b/i.test(normalized)) {
    return "heading"
  }

  if (/^#{1,6}\s+/.test(normalized)) {
    return "heading"
  }

  if (
    normalized.length <= 120 &&
    words.length <= 12 &&
    !/[.,;:!?]$/.test(normalized)
  ) {
    if (/^[A-Z0-9\s:'".,\-\/]+$/.test(normalized)) {
      return "heading"
    }

    const capitalizedWords = words.filter(w => /^[A-Z\u00C0-\u00D6\u00D8-\u00DE]/.test(w)).length;
    const isTitleCase = capitalizedWords >= words.length / 2;
    const isShort = words.length <= 4;
    
    if (
      (isTitleCase || isShort) &&
      /^[A-Z\u00C0-\u00D6\u00D8-\u00DE]/.test(normalized) &&
      !/^(the|a|an|in|on|at|by|for|with|and|or|but|is|was|were|are)\b/i.test(normalized) &&
      !/(?<!\b(?:Dr|St|Mr|Mrs|Ms|Prof|Rev|vs|etc|No))[.!?]['"”’\]\)]*\s+/i.test(normalized) &&
      !/\b(has|have|had|is|are|was|were|been|do|does|did|will|would|shall|should|can|could|may|might|must)\b/i.test(normalized) &&
      !/^\(/.test(normalized)
    ) {
      return "heading"
    }
  }

  if (/^(?:[-*]|\d+[.)])\s+/.test(normalized)) {
    return "list-item"
  }

  return "paragraph"
}

function getNextLineText(tokens: TextTokenDto[], tokenIndexes: number[], startPosInIndexes: number): string {
  const nextIndexes: number[] = []
  for (let i = startPosInIndexes + 1; i < tokenIndexes.length; i++) {
    const idx = tokenIndexes[i]
    if (idx === undefined) break
    const tok = tokens[idx]
    if (!tok) break
    if (tok.type === "SPACE" && /\n/.test(tok.text)) {
      if (nextIndexes.length > 0) break
      continue
    }
    nextIndexes.push(idx)
  }
  return getBlockText(tokens, nextIndexes)
}

export function buildReaderContentBlocks(
  tokens: TextTokenDto[],
  tokenIndexes: number[] = tokens.map((_, index) => index)
): ReaderContentBlock[] {
  const blocks: ReaderContentBlock[] = []
  let currentIndexes: number[] = []

  const flush = () => {
    const text = getBlockText(tokens, currentIndexes)
    if (!text) {
      currentIndexes = []
      return
    }

    const type = classifyBlock(text)
    const firstIndex = currentIndexes[0] ?? blocks.length
    blocks.push({
      id: `block-${firstIndex}`,
      type,
      tokenIndexes: [...currentIndexes],
      text: type === "heading" ? text.replace(/^#{1,6}\s*/, "") : text,
    })
    currentIndexes = []
  }

  for (let i = 0; i < tokenIndexes.length; i++) {
    const index = tokenIndexes[i]
    if (index === undefined) continue
    const token = tokens[index]
    if (!token) continue

    if (isParagraphBreak(token)) {
      flush()
      continue
    }

    if (isSoftLineBreak(token)) {
      const text = getBlockText(tokens, currentIndexes)
      if (text) {
        if (classifyBlock(text) === "heading") {
          flush()
          continue
        }
        const nextLineText = getNextLineText(tokens, tokenIndexes, i)
        if (nextLineText && classifyBlock(nextLineText) === "heading") {
          flush()
          continue
        }
      }
    }

    currentIndexes.push(index)
  }

  flush()
  return blocks
}

function isChapterHeading(block: ReaderContentBlock) {
  if (block.type !== "heading") return false

  return /^(?:chapter|part|book|section)\s+[\divxlc]+(?:\b|[:.\-])/i.test(block.text) ||
    /^(?:prologue|epilogue|introduction|foreword|afterword)\b/i.test(block.text)
}

export function buildReaderChapters(blocks: ReaderContentBlock[]): ReaderChapter[] {
  const chapters = blocks
    .filter(isChapterHeading)
    .map((block, index) => ({
      id: `chapter-${index + 1}-${block.tokenIndexes[0] ?? index}`,
      title: block.text,
      startTokenIndex: block.tokenIndexes[0] ?? 0,
      blockId: block.id,
    }))

  if (chapters.length > 0) return chapters

  const firstHeading = blocks.find((block) => block.type === "heading")
  if (!firstHeading) return []

  return [{
    id: `chapter-1-${firstHeading.tokenIndexes[0] ?? 0}`,
    title: firstHeading.text,
    startTokenIndex: firstHeading.tokenIndexes[0] ?? 0,
    blockId: firstHeading.id,
  }]
}

export function attachChaptersToBlocks(
  blocks: ReaderContentBlock[],
  chapters: ReaderChapter[]
): ReaderContentBlock[] {
  if (chapters.length === 0) return blocks

  return blocks.map((block) => {
    const firstIndex = block.tokenIndexes[0] ?? 0
    const chapter = [...chapters]
      .reverse()
      .find((item) => item.startTokenIndex <= firstIndex)

    return chapter ? { ...block, chapterId: chapter.id } : block
  })
}

export function findCurrentReaderChapter(
  chapters: ReaderChapter[],
  firstVisibleTokenIndex: number | null
): ReaderChapter | null {
  if (chapters.length === 0 || firstVisibleTokenIndex == null) return null

  return [...chapters]
    .reverse()
    .find((chapter) => chapter.startTokenIndex <= firstVisibleTokenIndex) ?? chapters[0]
}

/** Map API phrase status labels onto highlight statuses used by tokens */
export function mapAnalyzePhraseStatus(status: string | undefined | null): TextTokenStatus {
  const u = (status ?? "").toUpperCase()
  if (u === "NEW") return "NEW"
  if (u === "KNOWN") return "KNOWN"
  if (u === "IGNORED") return "IGNORED"
  if (u === "SAVED" || u === "LINGQ" || u === "LEARNING") return "LEARNING"
  return "NEW"
}

export type ReaderRenderSegment =
  | { type: "phrase"; startIndex: number; endIndex: number; text: string; status: TextTokenStatus }
  | { type: "token"; index: number }

/** Ordered segments for the visible token indexes with phrase spans merged (longer phrase wins overlaps). */
export function buildReaderDisplaySegments(
  tokens: TextTokenDto[],
  displayedTokenIndexes: number[],
  phrases: TextPhraseDto[] | undefined | null
): ReaderRenderSegment[] {
  const ordered = [...displayedTokenIndexes].sort((a, b) => a - b)
  if (!ordered.length) return []

  if (!phrases?.length) {
    return ordered.map((index) => ({ type: "token", index }))
  }

  const displayedSet = new Set(ordered)
  const sortedPhrases = [...phrases].sort((a, b) => {
    const spanA = Math.abs(a.endIndex - a.startIndex)
    const spanB = Math.abs(b.endIndex - b.startIndex)
    return spanB - spanA || Math.min(a.startIndex, a.endIndex) - Math.min(b.startIndex, b.endIndex)
  })

  const claimed = new Set<number>()
  type PhraseSegment = Extract<ReaderRenderSegment, { type: "phrase" }>
  const phrasesChosen: PhraseSegment[] = []

  for (const p of sortedPhrases) {
    const lo = Math.min(p.startIndex, p.endIndex)
    const hi = Math.max(p.startIndex, p.endIndex)
    let overlapOk = true
    for (let i = lo; i <= hi; i++) {
      if (!displayedSet.has(i) || claimed.has(i)) {
        overlapOk = false
        break
      }
    }
    if (!overlapOk) continue

    for (let i = lo; i <= hi; i++) claimed.add(i)

    let reconstructed = ""
    for (let i = lo; i <= hi; i++) {
      reconstructed += tokens[i]?.text ?? ""
    }
    const text = reconstructed.trim() ? reconstructed : p.text

    phrasesChosen.push({
      type: "phrase",
      startIndex: lo,
      endIndex: hi,
      text,
      status: mapAnalyzePhraseStatus(p.status),
    })
  }

  phrasesChosen.sort((a, b) => a.startIndex - b.startIndex)

  const phraseAtStart = new Map<number, PhraseSegment>()
  for (const seg of phrasesChosen) {
    phraseAtStart.set(seg.startIndex, seg)
  }

  const out: ReaderRenderSegment[] = []
  let k = 0
  while (k < ordered.length) {
    const idx = ordered[k]
    const phrase = phraseAtStart.get(idx)
    if (phrase) {
      out.push(phrase)
      while (k < ordered.length && ordered[k] <= phrase.endIndex) {
        k++
      }
      continue
    }
    if (claimed.has(idx)) {
      k++
      continue
    }
    out.push({ type: "token", index: idx })
    k++
  }

  return out
}

/** Concatenate token texts between inclusive indexes (preserves spaces/punctuation). */
export function buildPhraseSurfaceFromTokenRange(
  tokens: TextTokenDto[],
  startIndex: number,
  endIndex: number,
): string {
  const lo = Math.min(startIndex, endIndex)
  const hi = Math.max(startIndex, endIndex)
  let surface = ""
  for (let i = lo; i <= hi; i++) {
    surface += tokens[i]?.text ?? ""
  }
  return surface.replace(/\s+/g, " ").trim()
}

/** Distinct surface forms for WORD tokens with status NEW on this page (BulkMarkKnown termTexts). */
export function collectNewWordSurfacesForBulk(tokens: TextTokenDto[], tokenIndexes: number[]): string[] {
  const seen = new Set<string>()
  const surfaces: string[] = []

  for (const i of tokenIndexes) {
    const t = tokens[i]
    if (!t || t.type !== "WORD") continue
    if (normalizeReaderTokenStatus(t.status) !== "NEW") continue

    const surface = t.text.replace(/\s+/g, " ").trim()
    const key = readerNormalizeSurface(surface)
    if (!key || seen.has(key)) continue
    seen.add(key)
    surfaces.push(surface)
  }

  return surfaces
}

/** Compare PDF text-layer concat vs analyze token stream (conservative mismatch guard). */
export function readerPdfOverlayPlainNormalize(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase()
}

export function readerPlainOffsetRangeForTokenSpan(
  tokens: TextTokenDto[],
  startIndex: number,
  endIndex: number,
): { start: number; end: number } {
  const lo = Math.min(startIndex, endIndex)
  const hi = Math.max(startIndex, endIndex)
  let start = 0
  for (let i = 0; i < lo; i++) start += tokens[i]?.text?.length ?? 0
  let end = start
  for (let i = lo; i <= hi; i++) end += tokens[i]?.text?.length ?? 0
  return { start, end }
}

export function readerWordTokenIndexAtPlainOffset(tokens: TextTokenDto[], offset: number): number | null {
  if (!tokens.length || offset < 0) return null
  let pos = 0
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const len = t?.text?.length ?? 0
    const next = pos + len
    if (offset < next) {
      if (t?.type === "WORD") return i
      for (let j = i; j < tokens.length; j++) {
        if (tokens[j]?.type === "WORD") return j
      }
      for (let j = i - 1; j >= 0; j--) {
        if (tokens[j]?.type === "WORD") return j
      }
      return null
    }
    pos = next
  }
  for (let j = tokens.length - 1; j >= 0; j--) {
    if (tokens[j]?.type === "WORD") return j
  }
  return null
}

export function readerResolvePickAtPlainOffset(
  tokens: TextTokenDto[],
  phrases: TextPhraseDto[] | null | undefined,
  displayedIndexes: number[],
  offset: number,
):
  | { type: "phrase"; text: string; startIndex: number }
  | { type: "word"; token: TextTokenDto; index: number }
  | null {
  const segments = buildReaderDisplaySegments(tokens, displayedIndexes, phrases)
  for (const seg of segments) {
    if (seg.type !== "phrase") continue
    const { start, end } = readerPlainOffsetRangeForTokenSpan(tokens, seg.startIndex, seg.endIndex)
    if (offset >= start && offset < end) {
      return { type: "phrase", text: seg.text, startIndex: seg.startIndex }
    }
  }
  const idx = readerWordTokenIndexAtPlainOffset(tokens, offset)
  if (idx == null) return null
  const token = tokens[idx]
  if (!token || token.type !== "WORD") return null
  return { type: "word", token, index: idx }
}

export function readerOverlayVisualStatusAtPlainOffset(
  tokens: TextTokenDto[],
  phrases: TextPhraseDto[] | null | undefined,
  displayedIndexes: number[],
  offset: number,
): TextTokenStatus {
  const segments = buildReaderDisplaySegments(tokens, displayedIndexes, phrases)
  for (const seg of segments) {
    const { start, end } =
      seg.type === "phrase"
        ? readerPlainOffsetRangeForTokenSpan(tokens, seg.startIndex, seg.endIndex)
        : readerPlainOffsetRangeForTokenSpan(tokens, seg.index, seg.index)
    if (offset < start || offset >= end) continue
    if (seg.type === "phrase") return seg.status
    const tok = tokens[seg.index]
    return tok ? normalizeReaderTokenStatus(tok.status) : "NONE"
  }
  return "NONE"
}

/** Minimal styling for invisible PDF overlay hit targets (status-colored underline / wash). */
export function readerPdfOverlaySpanClass(status: TextTokenStatus | unknown): string {
  const s = normalizeReaderTokenStatus(status)
  switch (s) {
    case "NEW":
      return "rounded-[2px] border-b border-sky-500/55 bg-sky-500/15"
    case "LEARNING":
      return "rounded-[2px] border-b-2 border-amber-600/55 bg-amber-500/18"
    case "KNOWN":
      return "rounded-[2px] bg-transparent"
    case "IGNORED":
      return "rounded-[2px] bg-[#8b7b66]/10 opacity-75"
    default:
      return "rounded-[2px] bg-transparent"
  }
}

/**
 * Sanitizes source URLs to prevent exposing internal MinIO/storage download URLs
 * (e.g. http://minio:9000/polyraspad-media/documents/8cbdf152-1ee5-4447-9a6b-c0d176ab3402).
 * Converts document storage URLs to user-accessible reader links (/reader?bookId={id}).
 */
export function sanitizeSourceUrl(url?: string | null): string {
  if (!url?.trim()) return ""
  const trimmed = url.trim()

  const docMatch = trimmed.match(/\/documents\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)
  if (docMatch && docMatch[1]) {
    return `/reader?bookId=${docMatch[1]}`
  }

  if (trimmed.includes("minio:9000") || trimmed.includes("/polyraspad-media/")) {
    return ""
  }

  return trimmed
}

/**
 * Returns a user-accessible source URL for a Reader Library book or article.
 */
export function getBookSourceUrl(bookId?: string | null, rawUrl?: string | null): string {
  if (bookId?.trim()) {
    return `/reader?bookId=${bookId.trim()}`
  }
  return sanitizeSourceUrl(rawUrl)
}


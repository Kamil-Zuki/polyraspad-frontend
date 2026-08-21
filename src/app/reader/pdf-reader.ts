"use client"

export interface ParsedPdfDocument {
  text: string
  pageCount: number
}

/** Geometry matches canvas rendered at {@link PDF_PAGE_RENDER_SCALE}; positions are %-of-viewport for overlay layout. */
export interface PdfTextLayerSpan {
  text: string
  charStart: number
  charEnd: number
  leftPct: number
  topPct: number
  widthPct: number
  heightPct: number
}

export const PDF_PAGE_RENDER_SCALE = 1.65

export interface PdfDocumentHandle {
  pageCount: number
  getPageText: (pageNumber: number) => Promise<string>
  /** Positioned runs for interactive overlay (same scale as {@link PDF_PAGE_RENDER_SCALE}). */
  getPageTextLayerSpans: (pageNumber: number, scale?: number) => Promise<PdfTextLayerSpan[]>
  /** Renders selectable PDF fidelity for the learner (visual page). */
  renderPageToCanvas: (pageNumber: number, canvas: HTMLCanvasElement, scale?: number, zoom?: number) => Promise<void>
  destroy: () => Promise<void>
}

let pdfWorkerConfigured = false

type PdfPageTextItem = { str?: string }
type PdfPageProxy = {
  getTextContent: () => Promise<{ items: UnknownTextItem[] }>
  getViewport: (options: { scale: number }) => PdfViewportLike
}
type PdfViewportLike = {
  width: number
  height: number
  transform?: number[]
  rawDims?: {
    pageWidth: number
    pageHeight: number
    pageX: number
    pageY: number
  }
}

type UnknownTextItem =
  | PdfPageTextItem
  | {
      type?: string
      str?: string
      transform?: number[]
      width?: number
      height?: number
      hasEOL?: boolean
    }

/**
 * Detects which PDF text items begin a new paragraph using geometric heuristics:
 * 1. Indentation — the line starts significantly right of the dominant left margin
 * 2. Vertical gap — the distance from the previous line is > 1.5× the median line gap
 *
 * Returns a Set of item indices (into rawItems) that should start a new block.
 * Both extractPdfPageTextInternal and extractPdfPageTextLayerSpansInternal
 * must call this with the same items array so their character offsets stay in sync.
 */
function detectPdfParagraphStartIndexes(rawItems: UnknownTextItem[]): Set<number> {
  const paragraphStarts = new Set<number>()

  interface LineStartInfo { itemIndex: number; x: number; y: number }
  const lineStarts: LineStartInfo[] = []
  let prevHadEOL = true // treat the very first item as a line start

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i] as UnknownTextItem
    if (!item || typeof item !== "object" || !("str" in item) || item.str === undefined) continue
    const hasContent = Boolean(item.str.trim())
    const hasEOL = "hasEOL" in item ? Boolean(item.hasEOL) : false
    if (prevHadEOL && hasContent) {
      const geom = item as { transform?: number[] }
      lineStarts.push({ itemIndex: i, x: geom.transform?.[4] ?? 0, y: geom.transform?.[5] ?? 0 })
    }
    prevHadEOL = hasEOL
  }

  if (lineStarts.length < 4) return paragraphStarts

  // ---- Heuristic 1: indentation ----
  // Most common x among line starts = base left margin
  const xBuckets = new Map<number, number>()
  for (const ls of lineStarts) {
    const key = Math.round(ls.x)
    xBuckets.set(key, (xBuckets.get(key) ?? 0) + 1)
  }
  let baseMarginX = 0
  let maxCount = 0
  xBuckets.forEach((count, x) => {
    if (count > maxCount) { maxCount = count; baseMarginX = x }
  })

  // Median font height for indent threshold calibration
  const fontHeights: number[] = []
  for (const rawItem of rawItems) {
    const item = rawItem as { transform?: number[]; str?: string }
    if (!item?.transform || !item.str?.trim()) continue
    const h = Math.hypot(item.transform[2] ?? 0, item.transform[3] ?? 0)
    if (h > 0) fontHeights.push(h)
  }
  fontHeights.sort((a, b) => a - b)
  const medianFontHeight = fontHeights.length > 0
    ? fontHeights[Math.floor(fontHeights.length / 2)]
    : 10
  const indentThreshold = medianFontHeight * 1.0 // ~1 em

  if (maxCount >= lineStarts.length * 0.35) {
    for (let i = 1; i < lineStarts.length; i++) {
      if (Math.round(lineStarts[i].x) > baseMarginX + indentThreshold) {
        paragraphStarts.add(lineStarts[i].itemIndex)
      }
    }
  }

  // ---- Heuristic 2: vertical gap ----
  const yGaps: number[] = []
  for (let i = 1; i < lineStarts.length; i++) {
    const gap = Math.abs(lineStarts[i - 1].y - lineStarts[i].y)
    if (gap > 0) yGaps.push(gap)
  }
  if (yGaps.length >= 3) {
    const sorted = [...yGaps].sort((a, b) => a - b)
    const medianGap = sorted[Math.floor(sorted.length / 2)]
    if (medianGap > 0) {
      for (let i = 1; i < lineStarts.length; i++) {
        const gap = Math.abs(lineStarts[i - 1].y - lineStarts[i].y)
        if (gap > medianGap * 1.5) paragraphStarts.add(lineStarts[i].itemIndex)
      }
    }
  }

  return paragraphStarts
}

type PdfProxy = {
  numPages: number
  getPage: (pageNumber: number) => Promise<PdfPageProxy>
  cleanup?: () => void
  destroy?: () => void
}
type PdfLoadingTask = {
  promise: Promise<PdfProxy>
  destroy?: () => void
}

async function loadPdfModule() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")

  if (!pdfWorkerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString()
    pdfWorkerConfigured = true
  }

  return pdfjs
}

async function extractPdfPageTextInternal(pdf: PdfProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber)
  const content = await page.getTextContent()
  const paragraphStarts = detectPdfParagraphStartIndexes(content.items)

  let text = ""
  for (let itemIdx = 0; itemIdx < content.items.length; itemIdx++) {
    const item = content.items[itemIdx] as UnknownTextItem
    if (!item || typeof item !== "object") continue
    if (!("str" in item) || item.str === undefined) continue

    // Insert double newline before detected paragraph starts
    if (paragraphStarts.has(itemIdx) && text.length > 0) {
      text += "\n\n"
    }

    let itemStr = item.str
    const hasEOL = "hasEOL" in item ? Boolean(item.hasEOL) : false
    if (hasEOL && itemStr.endsWith("-")) {
      itemStr = itemStr.slice(0, -1)
      text += itemStr
    } else {
      text += itemStr
      if (hasEOL) {
        text += "\n"
      }
    }
  }
  return text
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

async function extractPdfPageTextLayerSpansInternal(
  pdf: PdfProxy,
  pdfjs: { Util: { transform: (a: number[], b: number[]) => number[] } },
  pageNumber: number,
  scale: number,
): Promise<PdfTextLayerSpan[]> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const vpAny = viewport as PdfViewportLike
  const rawDims = vpAny.rawDims ?? {
    pageWidth: viewport.width / scale,
    pageHeight: viewport.height / scale,
    pageX: 0,
    pageY: 0,
  }

  const layerTransform = [1, 0, 0, -1, -rawDims.pageX, rawDims.pageY + rawDims.pageHeight]

  const content = await page.getTextContent()
  const paragraphStarts = detectPdfParagraphStartIndexes(content.items)
  const spans: PdfTextLayerSpan[] = []
  let offset = 0

  const ascentRatio = 0.8

  for (let itemIdx = 0; itemIdx < content.items.length; itemIdx++) {
    const rawItem = content.items[itemIdx]
    const item = rawItem as UnknownTextItem
    if (!item || typeof item !== "object") continue
    if (!("str" in item) || item.str === undefined) continue

    // Account for extra paragraph-break characters (must match extractPdfPageTextInternal)
    if (paragraphStarts.has(itemIdx) && offset > 0) {
      offset += 2
    }

    let text = item.str
    let hasTrailingHyphenLineBreak = false
    const hasEOL = "hasEOL" in item ? Boolean(item.hasEOL) : false
    if (hasEOL && text.endsWith("-")) {
      text = text.slice(0, -1)
      hasTrailingHyphenLineBreak = true
    }

    const geom = item as {
      transform: number[]
      width?: number
      height?: number
    }

    if (!geom.transform || geom.transform.length < 6) continue

    const tx = pdfjs.Util.transform(layerTransform, geom.transform)
    const fontHeight = Math.hypot(tx[2], tx[3])
    const fontAscent = fontHeight * ascentRatio
    const left = tx[4]
    const top = tx[5] - fontAscent

    const glyphWidth = typeof geom.width === "number" ? geom.width : fontHeight * Math.max(text.length, 1) * 0.45
    const widthPx = Math.max(glyphWidth * scale, fontHeight * 0.35)
    const heightPx = Math.max(fontHeight, typeof geom.height === "number" ? geom.height : fontHeight)

    const charStart = offset
    const charEnd = offset + text.length

    spans.push({
      text,
      charStart,
      charEnd,
      leftPct: clampPct((100 * left) / viewport.width),
      topPct: clampPct((100 * top) / viewport.height),
      widthPct: clampPct((100 * widthPx) / viewport.width),
      heightPct: clampPct((100 * heightPx) / viewport.height),
    })

    offset += text.length
    if (hasEOL && !hasTrailingHyphenLineBreak) {
      offset += 1
    }
  }

  return spans
}

async function renderPdfPageToCanvasInternal(
  pdf: PdfProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = PDF_PAGE_RENDER_SCALE,
  zoom = 1,
): Promise<void> {
  const page = (await pdf.getPage(pageNumber)) as unknown as {
    getViewport: (options: { scale: number }) => { width: number; height: number }
    render: (options: unknown) => { promise: Promise<void> }
  }

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
  const renderScale = scale * zoom * dpr
  const viewport = page.getViewport({ scale: renderScale })
  const cssViewport = page.getViewport({ scale: scale * zoom })

  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  canvas.style.width = `${Math.floor(cssViewport.width)}px`
  canvas.style.height = `${Math.floor(cssViewport.height)}px`

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  // Reset any previous transform and clear the canvas to avoid ghosting,
  // flipped frames, or stale content when the canvas is re-used across modes.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const task = page.render({
    canvasContext: ctx,
    viewport,
  })

  await task.promise
}

export async function openPdfDocument(data: ArrayBuffer): Promise<PdfDocumentHandle> {
  const pdfjs = await loadPdfModule()

  const getDocument = pdfjs.getDocument as unknown as (source: unknown) => PdfLoadingTask
  const loadingTask = getDocument({
    data: new Uint8Array(data),
    useWorkerFetch: false,
    isEvalSupported: false,
  })

  const pdf = (await loadingTask.promise) as unknown as PdfProxy

  return {
    pageCount: pdf.numPages,
    getPageText: (pageNumber: number) => extractPdfPageTextInternal(pdf, pageNumber),
    getPageTextLayerSpans: (pageNumber: number, scale?: number) =>
      extractPdfPageTextLayerSpansInternal(pdf, pdfjs, pageNumber, scale ?? PDF_PAGE_RENDER_SCALE),
    renderPageToCanvas: (pageNumber: number, canvas: HTMLCanvasElement, scale?: number, zoom?: number) =>
      renderPdfPageToCanvasInternal(pdf, pageNumber, canvas, scale, zoom),
    destroy: async () => {
      pdf.cleanup?.()
      pdf.destroy?.()
      loadingTask.destroy?.()
    },
  }
}

export async function extractPdfText(data: ArrayBuffer): Promise<ParsedPdfDocument> {
  const pdf = await openPdfDocument(data)
  const pageCount = pdf.pageCount
  const pages: string[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const pageText = await pdf.getPageText(pageNumber)

      if (pageText) {
        pages.push(pageText)
      }
    }
  } finally {
    await pdf.destroy()
  }

  return {
    text: pages.join("\n\n"),
    pageCount,
  }
}

export function getPdfDisplayTitle(fileName: string): string {
  return fileName.replace(/\.pdf$/i, "").trim() || "Untitled book"
}

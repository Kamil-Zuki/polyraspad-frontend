/**
 * Structure-preserving EPUB parse + linear plain text per spine chapter for /text/analyze.
 */
import JSZip from "jszip"

export interface EpubSpineChapter {
  id: string
  href: string
  /** Sanitized serialized body inner HTML (embedded images → blob/object URLs resolved by caller). */
  bodyInnerHtml: string
  /** Plain text used for vocabulary analyze (exact join of rendered text-node order via DOMSerializer). */
  plainTextForAnalyze: string
}

export interface EpubParsedBook {
  title: string
  spine: EpubSpineChapter[]
}

function dirname(opfPath: string): string {
  const ix = opfPath.lastIndexOf("/")
  return ix === -1 ? "" : opfPath.slice(0, ix)
}

function resolveHref(baseDir: string, href: string): string {
  const combined = baseDir ? `${baseDir}/${href}` : href
  return combined.replace(/\\/g, "/").replace(/\/+/g, "/")
}

function readRootfilePath(containerXml: string): string | null {
  const m =
    containerXml.match(/full-path\s*=\s*"([^"]+)"/i) ??
    containerXml.match(/full-path\s*=\s*'([^']+)'/i)
  return m?.[1]?.trim() ?? null
}

const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "SECTION",
  "ARTICLE",
  "HEADER",
  "FOOTER",
  "NAV",
  "ASIDE",
  "FIGURE",
  "FIGCAPTION",
  "LI",
  "UL",
  "OL",
  "DL",
  "DT",
  "DD",
  "TABLE",
  "TR",
  "TD",
  "TH",
  "THEAD",
  "TBODY",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BR",
  "HR",
  "PRE",
  "BLOCKQUOTE",
])

function removeUnsafeElements(doc: Document) {
  const kill = ["script", "object", "embed", "iframe", "link", "meta", "base", "form", "input", "button", "audio", "video"]
  for (const tag of kill) {
    doc.querySelectorAll(tag).forEach((el) => el.remove())
  }
}

function stripEventHandlers(element: Element) {
  for (const attr of [...element.attributes]) {
    if (attr.name.toLowerCase().startsWith("on")) {
      element.removeAttribute(attr.name)
    }
    if (attr.name.toLowerCase() === "href" && /^javascript:/i.test(attr.value)) {
      element.removeAttribute("href")
    }
    if (attr.name.toLowerCase() === "src" && /^javascript:/i.test(attr.value)) {
      element.removeAttribute("src")
    }
  }
  for (const child of [...element.children]) {
    stripEventHandlers(child)
  }
}

function insertBlockBoundaries(body: HTMLElement) {
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT)
  const toMark: Element[] = []
  let n: Node | null = walker.nextNode()
  while (n) {
    if (n instanceof Element && BLOCK_TAGS.has(n.tagName)) {
      toMark.push(n)
    }
    n = walker.nextNode()
  }
  for (const el of toMark) {
    if (el.firstChild) {
      el.insertBefore(document.createTextNode("\n"), el.firstChild)
    }
  }
}

/** Walk text nodes in order; build plain string and segment map for highlight ranges. */
export function linearizeBodyTextNodes(body: HTMLElement): {
  text: string
  segments: { start: number; end: number; node: Text }[]
} {
  const segments: { start: number; end: number; node: Text }[] = []
  let text = ""
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  let node: Node | null = walker.nextNode()
  while (node) {
    if (node instanceof Text) {
      const raw = node.data
      const start = text.length
      text += raw
      const end = text.length
      if (end > start) {
        segments.push({ start, end, node })
      }
    }
    node = walker.nextNode()
  }
  return { text, segments }
}

export function charRangeToDomRange(
  segments: { start: number; end: number; node: Text }[],
  startChar: number,
  endChar: number,
): Range | null {
  if (startChar >= endChar || segments.length === 0) return null

  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0

  for (const seg of segments) {
    if (startChar >= seg.start && startChar < seg.end) {
      startNode = seg.node
      startOffset = startChar - seg.start
    }
    if (endChar > seg.start && endChar <= seg.end) {
      endNode = seg.node
      endOffset = endChar - seg.start
      break
    }
  }

  if (!startNode || !endNode) return null

  const range = document.createRange()
  try {
    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset)
    return range
  } catch {
    return null
  }
}

export function applyHighlightsToBody(
  body: HTMLElement,
  segments: { start: number; end: number; node: Text }[],
  ranges: { start: number; end: number; className: string; dataStatus: string }[],
): () => void {
  const cleanup: HTMLElement[] = []
  const sorted = [...ranges].sort((a, b) => b.start - a.start)

  for (const hl of sorted) {
    const r = charRangeToDomRange(segments, hl.start, hl.end)
    if (!r) continue
    try {
      const wrap = document.createElement("mark")
      wrap.className = hl.className
      wrap.dataset.readerStatus = hl.dataStatus
      wrap.setAttribute("data-reader-learn", "")
      r.surroundContents(wrap)
      cleanup.push(wrap)
    } catch {
      /* surroundContents fails if range splits non-text boundaries */
    }
  }

  return () => {
    for (const el of cleanup) {
      const parent = el.parentNode
      if (!parent) continue
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el)
      }
      parent.removeChild(el)
      parent.normalize()
    }
  }
}

async function resolveImagesInDocument(
  doc: Document,
  zip: JSZip,
  chapterDir: string,
  revoked: string[],
): Promise<void> {
  const imgs = doc.querySelectorAll("img[src]")
  for (const img of imgs) {
    const src = img.getAttribute("src")?.trim()
    if (!src || /^data:/i.test(src) || /^https?:\/\//i.test(src)) continue

    const path = resolveHref(chapterDir, src)
    const file = zip.file(path)
    if (!file) continue

    const ab = await file.async("arraybuffer")
    const ext = path.split(".").pop()?.toLowerCase()
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "gif"
            ? "image/gif"
            : ext === "svg"
              ? "image/svg+xml"
              : ext === "webp"
                ? "image/webp"
                : "application/octet-stream"

    const blob = new Blob([ab], { type: mime })
    const url = URL.createObjectURL(blob)
    revoked.push(url)
    img.setAttribute("src", url)
  }
}

function pickTitleFromOpf(opfXml: string): string | null {
  const dc = opfXml.match(
    /<dc:title[^>]*>([^<]+)<\/dc:title>/i,
  )?.[1]
  return dc?.trim() || null
}

function parseManifestAndSpine(opfXml: string): { manifest: Map<string, string>; spineIds: string[] } {
  const manifest = new Map<string, string>()
  const manifestBlock = opfXml.match(/<manifest[^>]*>([\s\S]*?)<\/manifest>/i)?.[1] ?? ""
  for (const item of manifestBlock.matchAll(/<item\b([^>]*)>/gi)) {
    const attrs = item[1] ?? ""
    const idM = attrs.match(/\bid\s*=\s*"([^"]+)"/i) ?? attrs.match(/\bid\s*=\s*'([^']+)'/i)
    const hrefM = attrs.match(/\bhref\s*=\s*"([^"]+)"/i) ?? attrs.match(/\bhref\s*=\s*'([^']+)'/i)
    if (idM?.[1] && hrefM?.[1]) {
      manifest.set(idM[1], hrefM[1])
    }
  }

  const spineBlock = opfXml.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i)?.[1] ?? ""
  const spineIds: string[] = []
  for (const ref of spineBlock.matchAll(/<itemref\b([^>]*)\/?>/gi)) {
    const attrs = ref[1] ?? ""
    const idrefM = attrs.match(/\bidref\s*=\s*"([^"]+)"/i) ?? attrs.match(/\bidref\s*=\s*'([^']+)'/i)
    if (idrefM?.[1]) spineIds.push(idrefM[1])
  }

  return { manifest, spineIds }
}

/**
 * Parse EPUB into spine chapters with sanitized HTML + linear plain text per chapter.
 * Caller should revoke returned blob URLs when disposing the book.
 */
export async function parseEpubBook(buffer: ArrayBuffer): Promise<{ book: EpubParsedBook; revokeObjectUrls: () => void }> {
  const zip = await JSZip.loadAsync(buffer)
  const revoked: string[] = []

  const containerEntry = zip.file("META-INF/container.xml") ?? zip.file("meta-inf/container.xml")
  if (!containerEntry) {
    throw new Error("Invalid EPUB: missing META-INF/container.xml.")
  }

  const containerXml = await containerEntry.async("string")
  const opfPath = readRootfilePath(containerXml)
  if (!opfPath) {
    throw new Error("Invalid EPUB: could not find OPF package path.")
  }

  const opfEntry = zip.file(opfPath)
  if (!opfEntry) {
    throw new Error(`Invalid EPUB: missing package file (${opfPath}).`)
  }

  const opfXml = await opfEntry.async("string")
  const opfDir = dirname(opfPath)
  const title = pickTitleFromOpf(opfXml) || "Imported EPUB"
  const { manifest, spineIds } = parseManifestAndSpine(opfXml)

  if (spineIds.length === 0) {
    throw new Error("Invalid EPUB: spine is empty.")
  }

  const spine: EpubSpineChapter[] = []

  for (const id of spineIds) {
    const href = manifest.get(id)
    if (!href) continue
    const resolved = resolveHref(opfDir, href)
    const lower = resolved.toLowerCase()
    if (!lower.endsWith(".html") && !lower.endsWith(".htm") && !lower.endsWith(".xhtml")) {
      continue
    }

    const mediaEntry = zip.file(resolved)
    if (!mediaEntry) continue

    const raw = await mediaEntry.async("string")
    const doc = new DOMParser().parseFromString(raw, "application/xhtml+xml")
    const parseError = doc.querySelector("parsererror")
    if (parseError) {
      continue
    }

    removeUnsafeElements(doc)
    const body = doc.querySelector("body") ?? doc.documentElement
    stripEventHandlers(body)
    insertBlockBoundaries(body as HTMLElement)
    await resolveImagesInDocument(doc, zip, dirname(resolved), revoked)

    const chapterDir = dirname(resolved)
    const bodyInnerHtml = body.innerHTML
    const clone = body.cloneNode(true) as HTMLElement
    const { text: plainTextForAnalyze } = linearizeBodyTextNodes(clone)

    if (!plainTextForAnalyze.trim()) continue

    spine.push({
      id,
      href: resolved,
      bodyInnerHtml,
      plainTextForAnalyze: plainTextForAnalyze.trim(),
    })
  }

  if (spine.length === 0) {
    throw new Error("Could not extract readable chapters from this EPUB.")
  }

  return {
    book: { title, spine },
    revokeObjectUrls: () => {
      for (const u of revoked) {
        try {
          URL.revokeObjectURL(u)
        } catch {
          /* ignore */
        }
      }
    },
  }
}

/** Backward-compatible: full plain text for legacy flows. */
export async function extractEpubPlainText(buffer: ArrayBuffer): Promise<string> {
  const { book, revokeObjectUrls } = await parseEpubBook(buffer)
  try {
    return book.spine.map((c) => c.plainTextForAnalyze).join("\n\n").trim()
  } finally {
    revokeObjectUrls()
  }
}

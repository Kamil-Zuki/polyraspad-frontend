import type { PdfTextLayerSpan } from "@/app/reader/pdf-reader"
import type { TextTokenDto } from "@/lib/api/types"

export interface PdfWordHitBox {
  text: string
  charStart: number
  charEnd: number
  leftPct: number
  topPct: number
  widthPct: number
  heightPct: number
}

/** Split pdf.js text runs into approximate per-word hit targets for overlay mode. */
export function expandSpansToWordHitBoxes(spans: PdfTextLayerSpan[]): PdfWordHitBox[] {
  const boxes: PdfWordHitBox[] = []

  for (const span of spans) {
    const raw = span.text
    if (!raw || !/\w/.test(raw)) continue

    const words = raw.match(/\S+/g) ?? []
    if (!words.length) continue

    const runWidth = Math.max(span.widthPct, 0.5)
    const wordWidth = runWidth / words.length
    let searchFrom = 0

    words.forEach((word, wordIndex) => {
      const idx = raw.indexOf(word, searchFrom)
      if (idx < 0) return
      searchFrom = idx + word.length

      boxes.push({
        text: word,
        charStart: span.charStart + idx,
        charEnd: span.charStart + idx + word.length,
        leftPct: span.leftPct + wordIndex * wordWidth,
        topPct: span.topPct,
        widthPct: Math.max(wordWidth, 0.35),
        heightPct: Math.max(span.heightPct, 1.1),
      })
    })
  }

  return boxes
}

/** Pick the WORD token whose stream offset is closest to the overlay char position. */
export function findTokenIndexNearCharOffset(
  tokens: TextTokenDto[],
  normKey: string,
  charStart: number,
): number {
  if (!normKey) return -1

  let offset = 0
  let bestIdx = -1
  let bestDist = Number.POSITIVE_INFINITY

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === "WORD") {
      const key = (token.termText ?? token.text).trim().toLowerCase().replace(/\s+/g, " ")
      if (key === normKey) {
        const dist = Math.abs(offset - charStart)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = i
        }
      }
    }
    offset += token.text.length
  }

  return bestIdx
}

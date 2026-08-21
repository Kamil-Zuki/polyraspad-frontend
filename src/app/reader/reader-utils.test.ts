import { describe, expect, it } from "vitest"
import type { TextPhraseDto, TextTokenDto } from "@/lib/api/types"
import {
  buildPhraseSurfaceFromTokenRange,
  buildReaderContentBlocks,
  buildReaderDisplaySegments,
  clientSideTokenize,
  collectNewWordSurfacesForBulk,
  extractSentenceFromTokens,
  getBookSourceUrl,
  readerNormalizeSurface,
  sanitizeSourceUrl,
} from "@/app/reader/reader-utils"

function word(text: string, status: TextTokenDto["status"] = "NEW"): TextTokenDto {
  return { text, type: "WORD", status, termText: readerNormalizeSurface(text) }
}

describe("buildPhraseSurfaceFromTokenRange", () => {
  it("joins tokens between indexes preserving spacing", () => {
    const tokens: TextTokenDto[] = [
      word("take"),
      { text: " ", type: "SPACE" },
      word("off"),
    ]
    expect(buildPhraseSurfaceFromTokenRange(tokens, 0, 2)).toBe("take off")
  })
})

describe("buildReaderDisplaySegments", () => {
  it("prefers phrase span over component words", () => {
    const tokens: TextTokenDto[] = [
      word("take", "LEARNING"),
      { text: " ", type: "SPACE" },
      word("off", "NEW"),
    ]
    const phrases: TextPhraseDto[] = [
      { startIndex: 0, endIndex: 2, text: "take off", status: "LEARNING" },
    ]
    const segments = buildReaderDisplaySegments(tokens, [0, 1, 2], phrases)
    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({ type: "phrase", text: "take off", startIndex: 0 })
  })

  it("keeps sleep and slept as separate word segments", () => {
    const tokens: TextTokenDto[] = [
      word("sleep", "KNOWN"),
      { text: " ", type: "SPACE" },
      word("slept", "NEW"),
    ]
    const segments = buildReaderDisplaySegments(tokens, [0, 1, 2], [])
    const words = segments
      .filter((s): s is { type: "token"; index: number } => s.type === "token")
      .map((s) => tokens[s.index])
      .filter((t) => t?.type === "WORD")
      .map((t) => t!.text)
    expect(words).toEqual(["sleep", "slept"])
  })
})

describe("extractSentenceFromTokens", () => {
  it("captures the sentence around a clicked word for Anki context", () => {
    const tokens: TextTokenDto[] = [
      word("They"),
      { text: " ", type: "SPACE" },
      word("look"),
      { text: " ", type: "SPACE" },
      word("forward"),
      { text: " ", type: "SPACE" },
      word("to"),
      { text: " ", type: "SPACE" },
      word("it"),
      { text: ".", type: "PUNCTUATION" },
    ]
    expect(extractSentenceFromTokens(tokens, 4)).toBe("They look forward to it.")
  })
})

describe("collectNewWordSurfacesForBulk", () => {
  it("returns distinct NEW word surfaces only", () => {
    const tokens: TextTokenDto[] = [
      word("alpha", "NEW"),
      { text: " ", type: "SPACE" },
      word("alpha", "NEW"),
      { text: " ", type: "SPACE" },
      word("beta", "KNOWN"),
    ]
    expect(collectNewWordSurfacesForBulk(tokens, [0, 1, 2, 3, 4])).toEqual(["alpha"])
  })
})

describe("buildReaderContentBlocks", () => {
  it("correctly identifies headings and splits paragraphs at soft line breaks preceding section headers", () => {
    const sampleText =
      "Preface / ix\nin Japan, Latvia, and Russia.\nForm and Content of Így Tanultam Nyelveket\nPerhaps because Lomb believes that language learning is important."
    const parsed = clientSideTokenize(sampleText)
    const blocks = buildReaderContentBlocks(parsed.tokens)

    expect(blocks).toHaveLength(4)
    expect(blocks[0].type).toBe("heading")
    expect(blocks[0].text).toBe("Preface / ix")
    expect(blocks[1].type).toBe("paragraph")
    expect(blocks[1].text).toBe("in Japan, Latvia, and Russia.")
    expect(blocks[2].type).toBe("heading")
    expect(blocks[2].text).toBe("Form and Content of Így Tanultam Nyelveket")
    expect(blocks[3].type).toBe("paragraph")
  })
})

describe("sanitizeSourceUrl and getBookSourceUrl", () => {
  it("converts MinIO internal storage URLs with document UUIDs into reader links", () => {
    const raw = "http://minio:9000/polyraspad-media/documents/8cbdf152-1ee5-4447-9a6b-c0d176ab3402"
    expect(sanitizeSourceUrl(raw)).toBe("/reader?bookId=8cbdf152-1ee5-4447-9a6b-c0d176ab3402")
  })

  it("converts localhost MinIO storage URLs with document UUIDs into reader links", () => {
    const raw = "http://localhost:9000/polyraspad-media/documents/8cbdf152-1ee5-4447-9a6b-c0d176ab3402"
    expect(sanitizeSourceUrl(raw)).toBe("/reader?bookId=8cbdf152-1ee5-4447-9a6b-c0d176ab3402")
  })

  it("clears internal MinIO URLs without valid document UUID", () => {
    const raw = "http://minio:9000/polyraspad-media/documents/unknown"
    expect(sanitizeSourceUrl(raw)).toBe("")
  })

  it("preserves external web URLs", () => {
    const raw = "https://example.com/article/123"
    expect(sanitizeSourceUrl(raw)).toBe("https://example.com/article/123")
  })

  it("getBookSourceUrl prioritizes bookId over raw MinIO URL", () => {
    const bookId = "8cbdf152-1ee5-4447-9a6b-c0d176ab3402"
    const raw = "http://minio:9000/polyraspad-media/documents/8cbdf152-1ee5-4447-9a6b-c0d176ab3402"
    expect(getBookSourceUrl(bookId, raw)).toBe("/reader?bookId=8cbdf152-1ee5-4447-9a6b-c0d176ab3402")
  })
})


import { describe, it, expect } from "vitest"
import { buildReaderPages } from "./reader-pagination"
import type { TextTokenDto } from "@/lib/api/types"
import { concatTokensPlainText, tokenRangeToPlainOffsets } from "./epub-chapter-body"

function word(text: string, status: TextTokenDto["status"] = "NEW"): TextTokenDto {
  return { text, type: "WORD", status }
}

function space(text = " "): TextTokenDto {
  return { text, type: "SPACE", status: "NEW" }
}

describe("buildReaderPages", () => {
  it("splits long token stream at sentence boundary after limit", () => {
    const tokens: TextTokenDto[] = [
      ...Array.from({ length: 1500 }, () => word("x")),
      { text: ".", type: "PUNCTUATION", status: "NEW" },
      ...Array.from({ length: 50 }, () => word("y")),
    ]
    const pages = buildReaderPages(tokens)
    expect(pages.length).toBeGreaterThanOrEqual(2)
    expect(pages[0]!.tokenIndexes[0]).toBe(0)
    expect(pages[1]!.tokenIndexes[0]).toBeGreaterThan(0)
  })
})

describe("epub-chapter-body offsets", () => {
  it("maps token span to plain offsets for phrase wrap", () => {
    const tokens: TextTokenDto[] = [word("take"), space(), word("off")]
    expect(concatTokensPlainText(tokens)).toBe("take off")
    expect(tokenRangeToPlainOffsets(tokens, 0, 2)).toEqual({ start: 0, end: 8 })
    expect(tokenRangeToPlainOffsets(tokens, 2, 0)).toEqual({ start: 0, end: 8 })
  })
})

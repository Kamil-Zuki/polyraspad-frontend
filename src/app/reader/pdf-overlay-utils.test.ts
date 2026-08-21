import { describe, expect, it } from "vitest"
import { expandSpansToWordHitBoxes, findTokenIndexNearCharOffset } from "@/app/reader/pdf-overlay-utils"
import type { PdfTextLayerSpan } from "@/app/reader/pdf-reader"
import type { TextTokenDto } from "@/lib/api/types"

describe("expandSpansToWordHitBoxes", () => {
  it("splits a text run into separate word hit boxes", () => {
    const spans: PdfTextLayerSpan[] = [
      {
        text: "hello world",
        charStart: 0,
        charEnd: 11,
        leftPct: 10,
        topPct: 20,
        widthPct: 40,
        heightPct: 3,
      },
    ]

    const boxes = expandSpansToWordHitBoxes(spans)
    expect(boxes).toHaveLength(2)
    expect(boxes[0]?.text).toBe("hello")
    expect(boxes[1]?.text).toBe("world")
    expect(boxes[0]?.charStart).toBe(0)
    expect(boxes[1]?.charStart).toBe(6)
  })
})

describe("findTokenIndexNearCharOffset", () => {
  it("picks the repeated word closest to the overlay char offset", () => {
    const tokens: TextTokenDto[] = [
      { type: "WORD", text: "sleep", termText: "sleep" },
      { type: "SPACE", text: " " },
      { type: "WORD", text: "more", termText: "more" },
      { type: "SPACE", text: " " },
      { type: "WORD", text: "sleep", termText: "sleep" },
    ]

    const first = findTokenIndexNearCharOffset(tokens, "sleep", 0)
    const second = findTokenIndexNearCharOffset(tokens, "sleep", 12)

    expect(first).toBe(0)
    expect(second).toBe(4)
  })
})

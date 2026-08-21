import { describe, expect, it } from "vitest"
import {
  appendNotesValue,
  buildExampleFieldPatch,
  buildPlaceholderImageUrl,
} from "@/lib/editor/polyguide-card-patches"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

describe("polyguide-card-patches", () => {
  it("buildExampleFieldPatch matches dashboard draft shape", () => {
    const patch = buildExampleFieldPatch("en", "ru", {
      sentence: "Memory fades quickly.",
      translation: "Память быстро угасает.",
    })
    expect(patch[SENTENCE_MINING.Expression]).toBe("Memory fades quickly.")
    expect(patch[SENTENCE_MINING.Translation]).toBe("Память быстро угасает.")
    expect(patch[SENTENCE_MINING.Example]).toBe(
      "EN: Memory fades quickly.\nRU: Память быстро угасает.",
    )
  })

  it("appendNotesValue preserves existing notes", () => {
    expect(appendNotesValue("first", "second")).toBe("first\n\nsecond")
    expect(appendNotesValue("", "second")).toBe("second")
  })

  it("buildPlaceholderImageUrl is deterministic for word and query", () => {
    const url = buildPlaceholderImageUrl("address", "office meeting")
    expect(url).toMatch(/^https:\/\/picsum\.photos\/seed\//)
  })
})

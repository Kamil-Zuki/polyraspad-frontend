import { describe, it, expect } from "vitest"
import {
  getTokenStatusClass,
  clientSideTokenize,
  extractSentenceFromTokens,
} from "./reader-utils"
import type { TextTokenDto } from "@/lib/api/types"

describe("getTokenStatusClass", () => {
  it("should return class string containing 'cyan' when status is NEW", () => {
    expect(getTokenStatusClass("NEW")).toContain("cyan")
  })

  it("should return class string containing 'amber' when status is LEARNING", () => {
    expect(getTokenStatusClass("LEARNING")).toContain("amber")
  })

  it("should return class string containing 'gray' when status is KNOWN", () => {
    expect(getTokenStatusClass("KNOWN")).toContain("gray")
  })
})

describe("clientSideTokenize", () => {
  it("should return tokens array with 2 WORD tokens when given 'Hello world', first 'Hello' status NEW", () => {
    const result = clientSideTokenize("Hello world")
    const wordTokens = result.tokens.filter((t) => t.type === "WORD")
    expect(wordTokens).toHaveLength(2)
    expect(wordTokens[0]).toMatchObject({ text: "Hello", status: "NEW" })
    expect(wordTokens[1]).toMatchObject({ text: "world", status: "NEW" })
  })
})

describe("extractSentenceFromTokens", () => {
  it("should return full sentence containing the word at index 1", () => {
    const tokens: TextTokenDto[] = [
      { text: "The", type: "WORD", status: "NEW" },
      { text: " ", type: "SPACE", status: "NONE" },
      { text: "cat", type: "WORD", status: "NEW" },
      { text: " ", type: "SPACE", status: "NONE" },
      { text: "jumped", type: "WORD", status: "NEW" },
      { text: ".", type: "PUNCTUATION", status: "NONE" },
    ]
    const sentence = extractSentenceFromTokens(tokens, 2) // index of "cat"
    expect(sentence).toContain("cat")
    expect(sentence).toBe("The cat jumped.")
  })
})

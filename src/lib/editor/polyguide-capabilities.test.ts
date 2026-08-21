import { describe, expect, it } from "vitest"
import { resolvePolyGuideCapabilities } from "@/lib/editor/polyguide-capabilities"

describe("polyguide-capabilities", () => {
  it("keeps basic tools available when AI models are unavailable", () => {
    const caps = resolvePolyGuideCapabilities("en", [], "openai-compatible", "gpt-4o-mini", "AI offline")
    expect(caps.translator.available).toBe(true)
    expect(caps.dictionary.available).toBe(true)
    expect(caps.tts.available).toBe(true)
    expect(caps.ai.available).toBe(false)
    expect(caps.ai.hint).toContain("AI offline")
  })

  it("enables AI when models are returned", () => {
    const caps = resolvePolyGuideCapabilities("en", ["gpt-4o-mini"], "openai-compatible", "gpt-4o-mini", null)
    expect(caps.ai.available).toBe(true)
  })
})

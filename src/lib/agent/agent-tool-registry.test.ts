import { describe, expect, it, vi, beforeEach } from "vitest"
import { executeAgentTool } from "@/lib/agent/agent-tool-registry"
import type { PolyGuideLanguageTools } from "@/lib/polyguide/use-polyguide-language-tools"

vi.mock("@/lib/api/ollama-client", () => ({
  ollamaGenerate: vi.fn(),
}))

import { ollamaGenerate } from "@/lib/api/ollama-client"

const mockOllamaGenerate = vi.mocked(ollamaGenerate)

const languageTools = {
  sourceLang: "en",
  targetLang: "ru",
  ollamaModel: "gpt-4o-mini",
  aiModels: ["gpt-4o-mini"],
  aiProvider: "openai-compatible" as const,
  aiLoadError: null,
  translateText: vi.fn(),
  lookupDictionary: vi.fn(),
} satisfies PolyGuideLanguageTools

const deps = {
  projectId: "p1",
  projectTitle: "English Mastery",
  sourceLang: "en",
  targetLang: "ru",
  languageTools,
  firstDeckId: "deck-1",
  fetchDailySummary: vi.fn(),
  fetchVocabularyStats: vi.fn(),
}

describe("executeAgentTool domain boundary", () => {
  beforeEach(() => {
    mockOllamaGenerate.mockReset()
  })

  it("refuses C# code generation without calling LLM", async () => {
    const trace = await executeAgentTool("Напиши код на C#", deps)

    expect(trace.message.refusal).toBe(true)
    expect(trace.message.intentCategory).toBe("out_of_scope")
    expect(trace.message.suggestedPrompts?.length).toBeGreaterThan(0)
    expect(trace.toolCalls[0]?.toolName).toBe("out_of_scope")
    expect(trace.toolCalls[0]?.status).toBe("completed")
    expect(mockOllamaGenerate).not.toHaveBeenCalled()
  })

  it("refuses general programming tasks without calling LLM", async () => {
    const trace = await executeAgentTool("Implement binary search in Python", deps)

    expect(trace.message.refusal).toBe(true)
    expect(trace.message.intentCategory).toBe("out_of_scope")
    expect(mockOllamaGenerate).not.toHaveBeenCalled()
  })

  it("allows language-learning fallback for allowed prompts", async () => {
    mockOllamaGenerate.mockResolvedValueOnce("Korean has honorifics worth studying.")

    const trace = await executeAgentTool("Tell me something interesting about Korean", deps)

    expect(trace.message.intentCategory).toBe("language_learning")
    expect(trace.toolCalls[0]?.toolName).toBe("general_answer")
    expect(trace.toolCalls[0]?.status).toBe("completed")
    expect(mockOllamaGenerate).toHaveBeenCalledOnce()
  })

  it("refuses explain routes that bypass router but fail domain gate", async () => {
    const trace = await executeAgentTool(
      "Explain how to implement binary search in Python",
      deps,
    )

    expect(trace.message.refusal).toBe(true)
    expect(trace.message.intentCategory).toBe("out_of_scope")
    expect(mockOllamaGenerate).not.toHaveBeenCalled()
  })
})

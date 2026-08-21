import { describe, expect, it } from "vitest"
import {
  buildOutOfScopeRefusal,
  classifyAgentDomain,
} from "@/lib/agent/agent-domain-policy"
import {
  extractTargetTerm,
  routeAgentIntent,
  sanitizeAgentLemmaLabels,
} from "@/lib/agent/agent-intent-router"

describe("classifyAgentDomain", () => {
  it("allows language-learning prompts", () => {
    expect(classifyAgentDomain("Tell me something interesting about Korean").allowed).toBe(true)
    expect(classifyAgentDomain("Translate this sentence into Russian").allowed).toBe(true)
  })

  it("refuses pure code generation", () => {
    const decision = classifyAgentDomain("Напиши код на C#")
    expect(decision.allowed).toBe(false)
    expect(decision.category).toBe("out_of_scope")
  })

  it("refuses general programming tasks", () => {
    expect(classifyAgentDomain("Implement binary search in Python").allowed).toBe(false)
  })

  it("allows code as language-learning material", () => {
    expect(
      classifyAgentDomain("What does class mean in this C# snippet?").allowed,
    ).toBe(true)
    expect(classifyAgentDomain("Translate this error message from the code").allowed).toBe(true)
    expect(classifyAgentDomain("Create cards from terms in this paragraph").allowed).toBe(true)
  })

  it("refuses unrelated general tasks", () => {
    expect(classifyAgentDomain("Write a business plan").allowed).toBe(false)
  })
})

describe("routeAgentIntent", () => {
  it("routes progress questions to get_progress", () => {
    expect(routeAgentIntent("How am I doing this week?").toolId).toBe("get_progress")
  })

  it("routes reader navigation", () => {
    const intent = routeAgentIntent("Open Reader")
    expect(intent.toolId).toBe("navigate")
    expect(intent.destination).toBe("reader")
  })

  it("routes explain prompts and keeps exact surface form", () => {
    const intent = routeAgentIntent('Explain the word "slept" in context')
    expect(intent.toolId).toBe("explain_word")
    expect(intent.word).toBe("slept")
  })

  it("routes card creation with quoted term", () => {
    const intent = routeAgentIntent('Create a flashcard for "memory"')
    expect(intent.toolId).toBe("build_card_draft")
    expect(intent.word).toBe("memory")
  })

  it("routes allowed language questions to general_answer", () => {
    expect(routeAgentIntent("Tell me something interesting about Korean").toolId).toBe(
      "general_answer",
    )
  })

  it("routes code generation to out_of_scope", () => {
    expect(routeAgentIntent("Напиши код на C#").toolId).toBe("out_of_scope")
    expect(routeAgentIntent("Implement binary search in Python").toolId).toBe("out_of_scope")
  })
})

describe("buildOutOfScopeRefusal", () => {
  it("mentions language-learning alternatives for code requests", () => {
    const msg = buildOutOfScopeRefusal("Напиши код на C#", "English")
    expect(msg).toMatch(/can't write or implement code/i)
    expect(msg).toMatch(/flashcard|vocabulary|translate/i)
  })
})

describe("extractTargetTerm", () => {
  it("prefers quoted surface forms", () => {
    expect(extractTargetTerm('Explain "take off"')).toBe("take off")
  })

  it("does not collapse different forms", () => {
    expect(extractTargetTerm('Explain "sleep"')).not.toBe("slept")
  })
})

describe("sanitizeAgentLemmaLabels", () => {
  it("removes lemma labels from assistant output", () => {
    const cleaned = sanitizeAgentLemmaLabels("Lemma: sleep\nThis means to rest.")
    expect(cleaned).not.toMatch(/lemma/i)
    expect(cleaned).toContain("This means to rest.")
  })
})

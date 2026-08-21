import {
  classifyAgentDomain,
  type AgentDomainCategory,
  type AgentDomainDecision,
} from "@/lib/agent/agent-domain-policy"

export type AgentToolId =
  | "explain_word"
  | "grammar_help"
  | "generate_example"
  | "build_card_draft"
  | "get_progress"
  | "navigate"
  | "general_answer"
  | "out_of_scope"

export interface RoutedAgentIntent {
  toolId: AgentToolId
  /** Target word or phrase (exact surface form). */
  word?: string
  /** Optional context sentence. */
  sentence?: string
  /** Navigation destination when toolId is navigate. */
  destination?: AgentNavigateDestination
  domain?: AgentDomainDecision
}

export type AgentNavigateDestination =
  | "reader"
  | "editor"
  | "study"
  | "vocabulary"
  | "import"
  | "library"

const QUOTED = /["'«]([^"'»]+)["'»]/g

function extractQuotedTerms(text: string): string[] {
  const terms: string[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(QUOTED.source, "g")
  while ((match = re.exec(text)) !== null) {
    const term = match[1]?.trim()
    if (term) terms.push(term)
  }
  return terms
}

/** Pull a likely target word/phrase from free text (term-first: keep exact surface form). */
export function extractTargetTerm(text: string): string | undefined {
  const quoted = extractQuotedTerms(text)
  if (quoted.length > 0) return quoted[quoted.length - 1]

  const forWord = text.match(
    /\b(?:word|phrase|term)\s+["']?([A-Za-zÀ-ÿ][\w\s'-]{0,40})/i,
  )
  if (forWord?.[1]?.trim()) return forWord[1].trim()

  const explainMatch = text.match(
    /\b(?:explain|define|meaning of|what does|what is)\s+(?:the\s+)?(?:word|phrase|term)?\s*["']?([A-Za-zÀ-ÿ][\w'-]{0,40})/i,
  )
  if (explainMatch?.[1]?.trim()) return explainMatch[1].trim()

  const cardMatch = text.match(
    /\b(?:card|flashcard)\s+(?:for|about)\s+["']?([A-Za-zÀ-ÿ][\w\s'-]{0,40})/i,
  )
  if (cardMatch?.[1]?.trim()) return cardMatch[1].trim()

  return undefined
}

function matchesNavigation(text: string): AgentNavigateDestination | null {
  const lower = text.toLowerCase()
  if (/\b(open|go to|show|launch)\b.*\breader\b|\bread books\b/.test(lower)) return "reader"
  if (/\b(open|go to|launch)\b.*\beditor\b|\bcreate card\b|\bmake a card\b/.test(lower)) return "editor"
  if (/\b(open|go to)\b.*\blibrary\b|\bmy decks\b/.test(lower)) return "library"
  if (/\b(open|go to|show)\b.*\bvocab|\bmy words\b|\bsaved words\b/.test(lower)) return "vocabulary"
  if (/\bimport\b/.test(lower)) return "import"
  if (
    /\bstart review\b|\bstudy now\b|\breview session\b|\bstart studying\b|\bstart a review\b/.test(
      lower,
    )
  ) {
    return "study"
  }
  return null
}

export function classifyAgentDomainForText(userText: string): AgentDomainDecision {
  return classifyAgentDomain(userText)
}

export function routeAgentIntent(userText: string): RoutedAgentIntent {
  const text = userText.trim()
  const lower = text.toLowerCase()

  const nav = matchesNavigation(text)
  if (nav) {
    return {
      toolId: "navigate",
      destination: nav,
      word: extractTargetTerm(text),
      domain: { allowed: true, category: "product_navigation" },
    }
  }

  if (
    /\bhow am i\b|\bmy progress\b|\bthis week\b|\bstreak\b|\bstats\b|\bhow am i doing\b/.test(
      lower,
    )
  ) {
    return {
      toolId: "get_progress",
      domain: { allowed: true, category: "progress" },
    }
  }

  if (/\bgrammar\b|\bwhy (?:is|does|was|did)\b|\bwhy .* used\b/.test(lower)) {
    return {
      toolId: "grammar_help",
      word: extractTargetTerm(text),
      sentence: extractSentenceContext(text),
      domain: { allowed: true, category: "language_learning" },
    }
  }

  if (/\bexample\b|\bsample sentence\b|\buse (?:it|this) in a sentence\b/.test(lower)) {
    return {
      toolId: "generate_example",
      word: extractTargetTerm(text),
      domain: { allowed: true, category: "language_learning" },
    }
  }

  if (
    /\bcreate\b.*\bcard\b|\bbuild\b.*\bcard\b|\bflashcard\b|\bmake a card\b|\bcards from\b/.test(
      lower,
    )
  ) {
    return {
      toolId: "build_card_draft",
      word: extractTargetTerm(text),
      sentence: extractSentenceContext(text),
      domain: { allowed: true, category: "language_learning" },
    }
  }

  if (
    /\bexplain\b|\bwhat does\b|\bmeaning of\b|\bdefine\b|\bwhat is\b.*\bword\b/.test(lower)
  ) {
    return {
      toolId: "explain_word",
      word: extractTargetTerm(text),
      sentence: extractSentenceContext(text),
      domain: { allowed: true, category: "language_learning" },
    }
  }

  const domain = classifyAgentDomain(text)
  if (!domain.allowed) {
    return { toolId: "out_of_scope", domain }
  }

  return { toolId: "general_answer", domain }
}

function extractSentenceContext(text: string): string | undefined {
  const inContext = text.match(/\bin context(?: of)?[:\s]+(.+)/i)
  if (inContext?.[1]?.trim()) return inContext[1].trim()
  const sentenceLabel = text.match(/\bsentence[:\s]+(.+)/i)
  if (sentenceLabel?.[1]?.trim()) return sentenceLabel[1].trim()
  return undefined
}

/** Guardrail: strip lemma-style labels from agent output shown to learners. */
export function sanitizeAgentLemmaLabels(text: string): string {
  return text
    .replace(/^\s*lemma\s*[:：]\s*.+$/gim, "")
    .replace(/\bLemma:\s*\S+/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export type { AgentDomainCategory, AgentDomainDecision }

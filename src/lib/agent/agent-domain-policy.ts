export type AgentDomainCategory =
  | "language_learning"
  | "product_navigation"
  | "progress"
  | "out_of_scope"

export interface AgentDomainDecision {
  allowed: boolean
  category: AgentDomainCategory
  reason?: string
}

/** Suggested follow-ups shown after an out-of-scope refusal. */
export const REFUSAL_SUGGESTED_PROMPTS = [
  "Translate this sentence",
  "Explain vocabulary from this text",
  'Create a flashcard for "memory"',
] as const

const LEARNING_MATERIAL_OVERRIDE =
  /\b(translate|vocabulary|words?|terms?|cards?|explain|meaning|grammar|learn)\b.*\b(from|in)\b.*\b(this|the)\b|\b(from|in)\b.*\b(this|the)\b.*\b(snippet|paragraph|text|code|error|message|comment|sentence)\b|\bwhat does\b.*\bmean\b.*\b(in|from)\b/i

const HARD_OUT_OF_SCOPE =
  /\b(write|implement|build|create|generate|make|code|program|debug|fix)\b.*\b(code|script|function|class|app|program|algorithm|api|backend|frontend)\b|\b(leetcode|homework solution|business plan|legal advice|medical advice)\b|\b(binary search|sort algorithm|machine learning model)\b|\bнапиши\s+код\b|\bнапиши\s+программ|\bреализуй\b.*\b(код|алгоритм|функци)/i

const LANGUAGE_LEARNING_SIGNALS =
  /\b(translate|translation|vocabulary|grammar|pronunciation|conjugat|tense|phrase|idiom|fluency|flashcard|sentence|word|phrase|language|english|russian|korean|german|french|spanish|japanese|chinese|learn|study|meaning|usage|difference between|how do (?:i|you) say|speak|read|write in|hi|hello|hey|greetings)\b|\b(cefr|a1|a2|b1|b2|c1|c2)\b|(?:^|[^a-zа-яё0-9_])(слово|фраза|перевед|граммат|произнош|изуч|язык|значени|привет|здравствуй|хай|добрый день|доброе утро|добрый вечер|здравствуйте|колод[а-я]*|карточ[а-я]*)(?=$|[^a-zа-яё0-9_])/i

/** Classify whether a free-form prompt belongs to PolyGuide's language-learning domain. */
export function classifyAgentDomain(userText: string): AgentDomainDecision {
  const text = userText.trim()
  const lower = text.toLowerCase()

  if (!text) {
    return { allowed: false, category: "out_of_scope", reason: "empty" }
  }

  if (LEARNING_MATERIAL_OVERRIDE.test(text)) {
    return { allowed: true, category: "language_learning" }
  }

  if (HARD_OUT_OF_SCOPE.test(text)) {
    return {
      allowed: false,
      category: "out_of_scope",
      reason: "general_programming_or_non_learning_task",
    }
  }

  if (LANGUAGE_LEARNING_SIGNALS.test(lower)) {
    return { allowed: true, category: "language_learning" }
  }

  return {
    allowed: false,
    category: "out_of_scope",
    reason: "not_language_learning",
  }
}

export function buildOutOfScopeRefusal(userText: string, sourceLangLabel: string): string {
  const mentionsCode =
    /c#|csharp|python|javascript|typescript|java/i.test(userText) ||
    /\bcode\b/i.test(userText) ||
    /код/i.test(userText) ||
    HARD_OUT_OF_SCOPE.test(userText)

  if (mentionsCode) {
    return `I can't write or implement code here. PolyGuide is for language learning in ${sourceLangLabel}.

Try one of these instead:
• Translate comments or error messages from the snippet
• Explain vocabulary like "class", "method", or "Console.WriteLine"
• Create flashcards from terms in the text`
  }

  return `I can only help with language learning in Polyraspad — vocabulary, grammar, reading, cards, study, and progress.

Try asking me to explain a word, translate a sentence, draft a card, or open Reader / Study.`
}

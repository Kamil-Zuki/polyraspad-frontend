/**
 * Выбор провайдера AI на странице /editor (сервер Next, см. /api/ai/*).
 */

export type EditorAiProvider = "gemini" | "aggregator"

/** Явный EDITOR_AI_PROVIDER: gemini | aggregator; иначе GEMINI_API_KEY → gemini, иначе aggregator (нужен AI_PROXY_API_KEY на BFF). */
export function getEditorAiProvider(): EditorAiProvider {
  const explicit = process.env.EDITOR_AI_PROVIDER?.trim().toLowerCase()
  if (explicit === "gemini") return "gemini"
  if (explicit === "aggregator") return "aggregator"
  const key = process.env.GEMINI_API_KEY?.trim()
  if (key) return "gemini"
  return "aggregator"
}

export function getConfiguredGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash"
}

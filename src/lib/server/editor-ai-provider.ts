/**
 * Выбор провайдера AI на странице /editor (только сервер Next, см. /api/ollama/*).
 */

export type EditorAiProvider = "ollama" | "gemini"

/** auto: при наличии GEMINI_API_KEY — Gemini, иначе Ollama */
export function getEditorAiProvider(): EditorAiProvider {
  const explicit = process.env.EDITOR_AI_PROVIDER?.trim().toLowerCase()
  if (explicit === "ollama") return "ollama"
  if (explicit === "gemini") return "gemini"
  const key = process.env.GEMINI_API_KEY?.trim()
  if (key) return "gemini"
  return "ollama"
}

export function getConfiguredGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash"
}

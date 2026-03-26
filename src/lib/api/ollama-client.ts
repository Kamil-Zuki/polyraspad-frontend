const API_BASE =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

/** Совпадает с дефолтом POST /api/ollama/generate (OLLAMA_MODEL в env сервера Next). */
export const EDITOR_DEFAULT_OLLAMA_MODEL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_EDITOR_OLLAMA_MODEL?.trim()) ||
  "qwen2.5:1.5b"

/**
 * Выбирает имя модели для редактора: точное совпадение или тег :latest из установленных,
 * иначе базовое имя (Ollama резолвит тег).
 */
export function resolveEditorOllamaModel(
  installedNames: string[],
  preferred: string = EDITOR_DEFAULT_OLLAMA_MODEL,
): string {
  const p = (preferred || "qwen2.5:1.5b").trim()
  if (installedNames.length === 0) return p

  const pl = p.toLowerCase()
  // Ollama часто отдаёт теги с другим регистром (например qwen2.5:1.5B) — без этого в API уходит «не то» имя
  const exactCi = installedNames.find(
    (n) => {
      const nl = n.toLowerCase()
      return nl === pl || nl === `${pl}:latest`
    },
  )
  if (exactCi) return exactCi

  const withTag = installedNames.find(
    (n) => n.startsWith(`${p}:`) || n.toLowerCase().startsWith(`${pl}:`),
  )
  if (withTag) return withTag

  return p
}

export interface OllamaGenerateOptions {
  prompt: string
  model?: string
  stream?: boolean
}

export interface OllamaGenerateResult {
  response: string
}

/** Чем обслуживается /editor: локальная Ollama или Google Gemini (см. EDITOR_AI_PROVIDER, GEMINI_API_KEY). */
export type EditorAiBackend = "ollama" | "gemini"

export async function ollamaListModels(): Promise<{
  models: string[]
  provider: EditorAiBackend
}> {
  const res = await fetch(`${API_BASE}/api/ollama/models`)
  const data = (await res.json()) as {
    models?: string[]
    provider?: EditorAiBackend
    error?: string
  }
  if (!res.ok) {
    throw new Error(data.error ?? `Ollama models error: ${res.status}`)
  }
  return {
    models: data.models ?? [],
    provider: data.provider === "gemini" ? "gemini" : "ollama",
  }
}

export async function ollamaGenerate(
  options: OllamaGenerateOptions,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/ollama/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: options.prompt,
      model: options.model,
      stream: options.stream ?? false,
    }),
  })

  const raw = await res.text()
  let data: {
    response?: string
    error?: string
    availableModels?: string[]
  }
  try {
    data = JSON.parse(raw) as typeof data
  } catch {
    throw new Error(
      raw?.slice(0, 180)
        ? `Неверный ответ сервера: ${raw.slice(0, 180)}`
        : `Ollama error: ${res.status}`,
    )
  }

  if (!res.ok) {
    const msg =
      (data.availableModels?.length ?? 0) > 0
        ? `${data.error} Available: ${data.availableModels?.join(", ")}`
        : data.error ?? `Ollama error: ${res.status}`
    throw new Error(msg)
  }

  return data.response ?? ""
}

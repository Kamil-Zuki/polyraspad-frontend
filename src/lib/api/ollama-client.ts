const API_BASE =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

/** Дефолт модели для UI; фактическую модель может зафиксировать Aggregator, если override запрещён. */
export const EDITOR_DEFAULT_AI_MODEL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_EDITOR_AI_MODEL?.trim()) ||
  "gpt-4o-mini"

/** @deprecated Use EDITOR_DEFAULT_AI_MODEL */
export const EDITOR_DEFAULT_OLLAMA_MODEL = EDITOR_DEFAULT_AI_MODEL

/**
 * Выбирает имя модели для редактора из списка, разрешённого сервером.
 */
export function resolveEditorOllamaModel(
  installedNames: string[],
  preferred: string = EDITOR_DEFAULT_AI_MODEL,
): string {
  const p = (preferred || "").trim()
  if (installedNames.length === 0) return p

  const pl = p.toLowerCase()
  if (!pl) return installedNames[0]
  const exactCi = installedNames.find((n) => {
    const nl = n.toLowerCase()
    return nl === pl || nl === `${pl}:latest`
  })
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

/** Провайдер ответа BFF: Gemini или OpenAI-compatible через Aggregator. */
export type EditorAiBackend = "gemini" | "openai-compatible"

export async function ollamaListModels(): Promise<{
  models: string[]
  provider: EditorAiBackend
}> {
  const res = await fetch(`${API_BASE}/api/ai/models`)
  const data = (await res.json()) as {
    models?: string[]
    provider?: string
    error?: string
  }
  if (!res.ok) {
    throw new Error(data.error ?? `AI models error: ${res.status}`)
  }
  return {
    models: data.models ?? [],
    provider: data.provider === "gemini" ? "gemini" : "openai-compatible",
  }
}

export async function ollamaGenerate(
  options: OllamaGenerateOptions,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/ai/generate`, {
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
        ? `Invalid server response: ${raw.slice(0, 180)}`
        : `AI error: ${res.status}`,
    )
  }

  if (!res.ok) {
    const msg =
      (data.availableModels?.length ?? 0) > 0
        ? `${data.error} Available: ${data.availableModels?.join(", ")}`
        : data.error ?? `AI error: ${res.status}`
    throw new Error(msg)
  }

  return data.response ?? ""
}

export interface MiningDraftResponse {
  targetTranslationInContext: string
  sentenceTranslation: string
  dictionaryLemmaHint?: string | null
}

/** Черновик для reader mining (нужен AI_PROXY_API_KEY на Next + Ai:ApiKey на Aggregator). */
export async function fetchMiningDraftClient(body: {
  sentence: string
  target: string
  sourceLanguage?: string
  targetLanguage?: string
}): Promise<MiningDraftResponse> {
  const res = await fetch(`${API_BASE}/api/ai/mining-draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const raw = await res.text()
  let data: MiningDraftResponse & { error?: string }
  try {
    data = JSON.parse(raw) as typeof data
  } catch {
    throw new Error(raw.slice(0, 180) || `Mining draft error: ${res.status}`)
  }
  if (!res.ok) {
    throw new Error(data.error ?? `Mining draft error: ${res.status}`)
  }
  return data
}

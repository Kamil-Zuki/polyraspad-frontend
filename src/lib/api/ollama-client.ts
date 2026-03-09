const API_BASE =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export interface OllamaGenerateOptions {
  prompt: string
  model?: string
  stream?: boolean
}

export interface OllamaGenerateResult {
  response: string
}

export async function ollamaListModels(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/ollama/models`)
  const data = (await res.json()) as { models?: string[]; error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? `Ollama models error: ${res.status}`)
  }
  return data.models ?? []
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

  const data = (await res.json()) as {
    response?: string
    error?: string
    availableModels?: string[]
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

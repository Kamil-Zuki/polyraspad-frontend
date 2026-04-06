import { NextResponse } from "next/server"
import {
  fetchAggregatorOllamaModels,
  isAggregatorOllamaProxyConfigured,
} from "@/lib/server/aggregator-ollama-proxy"
import {
  getConfiguredGeminiModelId,
  getEditorAiProvider,
} from "@/lib/server/editor-ai-provider"

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"

export interface OllamaModelSummary {
  name: string
  model?: string
  modified_at?: string
  size?: number
}

export interface OllamaTagsResponse {
  models?: OllamaModelSummary[]
}

export async function GET() {
  try {
    if (getEditorAiProvider() === "gemini") {
      if (!process.env.GEMINI_API_KEY?.trim()) {
        return NextResponse.json(
          {
            error:
              "Режим Gemini: укажите GEMINI_API_KEY в .env или установите EDITOR_AI_PROVIDER=ollama.",
            models: [] as string[],
            provider: "gemini" as const,
          },
          { status: 503 },
        )
      }
      const id = getConfiguredGeminiModelId()
      return NextResponse.json({
        models: [id],
        provider: "gemini" as const,
      })
    }

    if (isAggregatorOllamaProxyConfigured()) {
      const res = await fetchAggregatorOllamaModels()
      const raw = await res.text()
      if (!res.ok) {
        let errMsg = raw
        try {
          const j = JSON.parse(raw) as { error?: string }
          if (j.error) errMsg = j.error
        } catch {
          /* как есть */
        }
        return NextResponse.json(
          { error: errMsg || `Aggregator Ollama proxy: ${res.status}`, models: [] },
          { status: res.status },
        )
      }
      try {
        const data = JSON.parse(raw) as { models?: string[]; provider?: string }
        return NextResponse.json({
          models: data.models ?? [],
          provider: "ollama" as const,
        })
      } catch {
        return NextResponse.json(
          { error: "Некорректный ответ прокси Aggregator", models: [] },
          { status: 502 },
        )
      }
    }

    const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json(
        { error: err || `Ollama error: ${res.status}`, models: [] },
        { status: res.status },
      )
    }

    const data = (await res.json()) as OllamaTagsResponse
    const models = data.models ?? []
    const names = models.map((m) => m.name ?? m.model).filter(Boolean) as string[]

    return NextResponse.json({ models: names, provider: "ollama" as const })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Ollama request failed: ${msg}`, models: [] },
      { status: 500 },
    )
  }
}

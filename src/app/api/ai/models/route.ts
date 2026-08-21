import { NextResponse } from "next/server"
import {
  fetchAggregatorAiModels,
  isAggregatorAiProxyConfigured,
} from "@/lib/server/aggregator-ai-proxy"
import {
  getConfiguredGeminiModelId,
  getEditorAiProvider,
} from "@/lib/server/editor-ai-provider"

export async function GET() {
  try {
    if (getEditorAiProvider() === "gemini") {
      if (!process.env.GEMINI_API_KEY?.trim()) {
        return NextResponse.json(
          {
            error:
              "Gemini mode: set GEMINI_API_KEY in .env or set EDITOR_AI_PROVIDER=aggregator with AI_PROXY_API_KEY.",
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

    if (isAggregatorAiProxyConfigured()) {
      const res = await fetchAggregatorAiModels()
      const raw = await res.text()
      if (!res.ok) {
        let errMsg = raw
        try {
          const j = JSON.parse(raw) as { error?: string }
          if (j.error) errMsg = j.error
        } catch {
          /* keep raw */
        }
        return NextResponse.json(
          { error: errMsg || `Aggregator AI proxy: ${res.status}`, models: [] },
          { status: res.status },
        )
      }
      try {
        const data = JSON.parse(raw) as { models?: string[]; provider?: string }
        return NextResponse.json({
          models: data.models ?? [],
          provider: "openai-compatible" as const,
        })
      } catch {
        return NextResponse.json(
          { error: "Invalid Aggregator AI proxy response", models: [] },
          { status: 502 },
        )
      }
    }

    return NextResponse.json(
      {
        error:
          "No AI backend: set AI_PROXY_API_KEY for Aggregator OpenAI-compatible proxy, or GEMINI_API_KEY for Gemini.",
        models: [],
      },
      { status: 503 },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `AI models request failed: ${msg}`, models: [] },
      { status: 500 },
    )
  }
}

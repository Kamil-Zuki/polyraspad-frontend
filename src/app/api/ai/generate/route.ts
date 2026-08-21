import { NextRequest, NextResponse } from "next/server"
import {
  fetchAggregatorAiGenerate,
  isAggregatorAiProxyConfigured,
} from "@/lib/server/aggregator-ai-proxy"
import { getEditorAiProvider } from "@/lib/server/editor-ai-provider"
import { geminiGenerateText } from "@/lib/server/gemini-generate"

/** Default model hint when clients omit model (Aggregator enforces its own if override disallowed). */
const DEFAULT_AI_MODEL = process.env.NEXT_PUBLIC_EDITOR_AI_MODEL?.trim() ?? "gpt-4o-mini"

export interface AiGenerateBody {
  prompt: string
  model?: string
  stream?: boolean
}

async function doGenerateViaAggregator(
  model: string | undefined,
  prompt: string,
  stream: boolean,
): Promise<{
  ok: boolean
  data?: { response?: string; error?: string; model?: string }
  errText?: string
  status?: number
}> {
  const controller = new AbortController()
  const timeoutMs = 180_000
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    const body: { prompt: string; stream: boolean; model?: string } = { prompt, stream }
    if (model) body.model = model
    res = await fetchAggregatorAiGenerate(body, controller.signal)
  } catch (e) {
    clearTimeout(timer)
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("abort") || msg.includes("Abort")) {
      return { ok: false, errText: `AI proxy request timed out after ${timeoutMs}ms`, status: 504 }
    }
    return { ok: false, errText: `AI proxy fetch error: ${msg}`, status: 502 }
  }
  clearTimeout(timer)
  const errText = await res.text()
  if (!res.ok) {
    return { ok: false, errText, status: res.status }
  }
  try {
    const data = JSON.parse(errText) as { response?: string; error?: string; model?: string }
    return { ok: res.ok, data }
  } catch {
    return { ok: true, data: { response: errText } }
  }
}

export async function POST(request: NextRequest) {
  let body: AiGenerateBody
  try {
    const raw = (await request.text()).replace(/^\uFEFF/, "").trim()
    if (!raw) {
      return NextResponse.json({ error: "Request body is empty" }, { status: 400 })
    }
    body = JSON.parse(raw) as AiGenerateBody
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body (check Content-Type: application/json)." },
      { status: 400 },
    )
  }

  try {
    let { model = DEFAULT_AI_MODEL, stream = false } = body
    model = model.trim()
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (getEditorAiProvider() === "gemini") {
      const key = process.env.GEMINI_API_KEY?.trim()
      if (!key) {
        return NextResponse.json(
          {
            error:
              "Gemini mode: set GEMINI_API_KEY in the Next server .env, or use EDITOR_AI_PROVIDER=aggregator with AI_PROXY_API_KEY.",
          },
          { status: 503 },
        )
      }

      const controller = new AbortController()
      const timeoutMs = 180_000
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const { text, modelId } = await geminiGenerateText(prompt, controller.signal)
        clearTimeout(timer)
        return NextResponse.json({ response: text, model: modelId, provider: "gemini" })
      } catch (e) {
        clearTimeout(timer)
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("abort") || msg.includes("Abort")) {
          return NextResponse.json(
            { error: `Gemini: timeout after ${timeoutMs}ms` },
            { status: 504 },
          )
        }
        return NextResponse.json({ error: msg }, { status: 502 })
      }
    }

    if (isAggregatorAiProxyConfigured()) {
      const modelForBody = model.length > 0 ? model : undefined
      const result = await doGenerateViaAggregator(modelForBody, prompt, stream)
      if (!result.ok) {
        return NextResponse.json(
          { error: result.errText ?? `AI proxy error: ${result.status}` },
          { status: result.status ?? 500 },
        )
      }
      const data = result.data!
      if (data.error) {
        return NextResponse.json({ error: data.error }, { status: 500 })
      }
      return NextResponse.json({
        response: data.response ?? "",
        model: data.model ?? modelForBody ?? "",
        provider: "openai-compatible",
      })
    }

    return NextResponse.json(
      {
        error:
          "No AI backend: set AI_PROXY_API_KEY (Aggregator Ai:ApiKey + proxy secret) or GEMINI_API_KEY.",
      },
      { status: 503 },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: `AI request failed: ${msg}` }, { status: 500 })
  }
}

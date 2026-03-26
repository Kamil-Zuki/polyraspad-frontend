import { NextRequest, NextResponse } from "next/server"
import { getEditorAiProvider } from "@/lib/server/editor-ai-provider"
import { geminiGenerateText } from "@/lib/server/gemini-generate"

// 127.0.0.1 надёжнее localhost на Windows, если Ollama слушает только IPv4
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL?.trim() ?? ""

export interface OllamaGenerateBody {
  prompt: string
  model?: string
  stream?: boolean
}

async function fetchAvailableModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`)
    if (!res.ok) return []
    const data = (await res.json()) as { models?: { name?: string; model?: string }[] }
    return (data.models ?? [])
      .map((m) => m.name ?? m.model)
      .filter((n): n is string => !!n)
  } catch {
    return []
  }
}

async function doGenerate(
  model: string,
  prompt: string,
  stream: boolean,
): Promise<{ ok: boolean; data?: { response?: string; error?: string }; errText?: string; status?: number }> {
  // Таймаут для медленных CPU-моделей (крупные модели могут генерировать >30 сек)
  const controller = new AbortController()
  const timeoutMs = 180_000
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream }),
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("abort") || msg.includes("Abort")) {
      return { ok: false, errText: `Ollama request timed out after ${timeoutMs}ms`, status: 504 }
    }
    return { ok: false, errText: `Ollama fetch error: ${msg}`, status: 502 }
  }
  clearTimeout(timer)
  const errText = await res.text()
  if (!res.ok) {
    return { ok: false, errText, status: res.status }
  }
  try {
    const data = JSON.parse(errText) as { response?: string; error?: string }
    return { ok: res.ok, data }
  } catch {
    return { ok: true, data: { response: errText } }
  }
}

export async function POST(request: NextRequest) {
  let body: OllamaGenerateBody
  try {
    const raw = (await request.text()).replace(/^\uFEFF/, "").trim()
    if (!raw) {
      return NextResponse.json({ error: "Пустое тело запроса" }, { status: 400 })
    }
    body = JSON.parse(raw) as OllamaGenerateBody
  } catch {
    return NextResponse.json(
      { error: "Некорректный JSON в теле запроса (проверьте Content-Type: application/json)." },
      { status: 400 },
    )
  }

  try {
    let { model = OLLAMA_MODEL, stream = false } = body
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
              "Режим Gemini: задайте GEMINI_API_KEY в .env (сервер Next). Или EDITOR_AI_PROVIDER=ollama для локальной Ollama.",
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
            { error: `Gemini: таймаут ${timeoutMs} мс` },
            { status: 504 },
          )
        }
        return NextResponse.json({ error: msg }, { status: 502 })
      }
    }

    if (!model) {
      const models = await fetchAvailableModels()
      if (models.length === 0) {
        return NextResponse.json(
          {
            error:
              "Модель не указана. Задайте OLLAMA_MODEL в .env (сервер Next) или передайте model в запросе.",
          },
          { status: 400 },
        )
      }
      model = models[0]
    }

    let result = await doGenerate(model, prompt, stream)

    if (!result.ok && result.errText?.toLowerCase().includes("not found")) {
      const models = await fetchAvailableModels()
      const fallback = models[0]
      if (fallback && fallback !== model) {
        model = fallback
        result = await doGenerate(model, prompt, stream)
      }
      if (!result.ok && models.length > 0) {
        return NextResponse.json(
          {
            error: `Model "${body.model ?? OLLAMA_MODEL}" not found. Available: ${models.join(", ")}. Set OLLAMA_MODEL or run: ollama pull <model>`,
            availableModels: models,
          },
          { status: 400 },
        )
      }
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.errText ?? `Ollama error: ${result.status}` },
        { status: result.status ?? 500 },
      )
    }

    const data = result.data!
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 500 })
    }

    return NextResponse.json({ response: data.response ?? "", model, provider: "ollama" })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Ollama request failed: ${msg}` },
      { status: 500 },
    )
  }
}

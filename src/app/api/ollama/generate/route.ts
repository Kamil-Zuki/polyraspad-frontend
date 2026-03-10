import { NextRequest, NextResponse } from "next/server"

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2"

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
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream }),
  })
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
  try {
    const body = (await request.json()) as OllamaGenerateBody
    let { model = OLLAMA_MODEL, stream = false } = body
    const prompt = body.prompt?.trim()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
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

    return NextResponse.json({ response: data.response ?? "", model })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Ollama request failed: ${msg}` },
      { status: 500 },
    )
  }
}

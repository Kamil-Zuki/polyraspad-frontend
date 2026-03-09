import { NextResponse } from "next/server"

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"

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

    return NextResponse.json({ models: names })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { error: `Ollama request failed: ${msg}`, models: [] },
      { status: 500 },
    )
  }
}

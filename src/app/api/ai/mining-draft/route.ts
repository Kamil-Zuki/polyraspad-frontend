import { NextRequest, NextResponse } from "next/server"
import {
  fetchAggregatorAiMiningDraft,
  isAggregatorAiProxyConfigured,
} from "@/lib/server/aggregator-ai-proxy"

export interface MiningDraftBody {
  sentence: string
  target: string
  sourceLanguage?: string
  targetLanguage?: string
}

export async function POST(request: NextRequest) {
  if (!isAggregatorAiProxyConfigured()) {
    return NextResponse.json(
      { error: "Mining draft requires AI_PROXY_API_KEY and Aggregator Ai:ApiKey." },
      { status: 503 },
    )
  }

  let body: MiningDraftBody
  try {
    const raw = (await request.text()).replace(/^\uFEFF/, "").trim()
    if (!raw) {
      return NextResponse.json({ error: "Request body is empty" }, { status: 400 })
    }
    body = JSON.parse(raw) as MiningDraftBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const sentence = body.sentence?.trim() ?? ""
  const target = body.target?.trim() ?? ""
  if (!sentence || !target) {
    return NextResponse.json({ error: "sentence and target are required." }, { status: 400 })
  }

  const controller = new AbortController()
  const timeoutMs = 180_000
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetchAggregatorAiMiningDraft(
      {
        sentence,
        target,
        sourceLanguage: body.sourceLanguage ?? "en",
        targetLanguage: body.targetLanguage ?? "ru",
      },
      controller.signal,
    )
    clearTimeout(timer)
    const text = await res.text()
    if (!res.ok) {
      let errMsg = text
      try {
        const j = JSON.parse(text) as { error?: string }
        if (j.error) errMsg = j.error
      } catch {
        /* keep */
      }
      return NextResponse.json({ error: errMsg || `Aggregator: ${res.status}` }, { status: res.status })
    }
    try {
      const data = JSON.parse(text) as Record<string, unknown>
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Invalid JSON from Aggregator." }, { status: 502 })
    }
  } catch (e) {
    clearTimeout(timer)
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("abort") || msg.includes("Abort")) {
      return NextResponse.json({ error: `Mining draft timed out after ${timeoutMs}ms` }, { status: 504 })
    }
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

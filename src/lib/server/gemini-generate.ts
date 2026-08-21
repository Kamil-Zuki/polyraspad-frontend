import { getConfiguredGeminiModelId } from "@/lib/server/editor-ai-provider"

/** Ответ generateContent (нужны только поля для текста и ошибок) */
interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string; blockReasonMessage?: string }
  error?: { message?: string; code?: number; status?: string }
}

/**
 * Один запрос generateContent к Google AI (Gemini). Ключ только на сервере (GEMINI_API_KEY).
 */
export async function geminiGenerateText(
  prompt: string,
  signal: AbortSignal,
): Promise<{ text: string; modelId: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add the key to the Next.js server .env.")
  }

  const modelId = getConfiguredGeminiModelId()
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
    signal,
  })

  const raw = await res.text()
  let data: GeminiGenerateResponse
  try {
    data = JSON.parse(raw) as GeminiGenerateResponse
  } catch {
    throw new Error(
      res.ok
        ? `Gemini: response is not JSON (${raw.slice(0, 120)})`
        : `Gemini HTTP ${res.status}: ${raw.slice(0, 200)}`,
    )
  }

  if (data.error?.message) {
    throw new Error(`Gemini: ${data.error.message}`)
  }

  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}: ${data.error?.message ?? raw.slice(0, 200)}`)
  }

  const block = data.promptFeedback?.blockReason
  if (block) {
    const msg = data.promptFeedback?.blockReasonMessage ?? block
    throw new Error(`Gemini blocked the request: ${msg}`)
  }

  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
  const trimmed = text.trim()
  if (!trimmed) {
    const reason = data.candidates?.[0]?.finishReason
    throw new Error(
      reason
        ? `Gemini returned empty text (finishReason: ${reason})`
        : "Gemini returned empty text",
    )
  }

  return { text: trimmed, modelId }
}

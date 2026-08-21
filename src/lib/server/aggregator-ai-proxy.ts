function aiProxyApiKey(): string {
  return process.env.AI_PROXY_API_KEY?.trim() ?? ""
}

/**
 * Базовый URL Aggregator для серверных вызовов Next (BFF).
 */
function aggregatorBaseUrl(): string {
  const internalUrl = process.env.AGGREGATOR_INTERNAL_URL?.trim()
  if (internalUrl) return internalUrl.replace(/\/$/, "")
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (pub) return pub.replace(/\/$/, "")
  return "http://127.0.0.1:5000"
}

/** Прокси LLM через Aggregator, если задан AI_PROXY_API_KEY (заголовок X-Ai-Proxy-Key). */
export function isAggregatorAiProxyConfigured(): boolean {
  return aiProxyApiKey().length > 0
}

const proxyHeaders = () => ({
  "Content-Type": "application/json",
  "X-Ai-Proxy-Key": aiProxyApiKey(),
})

export async function fetchAggregatorAiModels(): Promise<Response> {
  const base = aggregatorBaseUrl()
  return fetch(`${base}/api/ai/models`, {
    method: "GET",
    headers: { "X-Ai-Proxy-Key": aiProxyApiKey() },
  })
}

export async function fetchAggregatorAiGenerate(
  body: { prompt: string; model?: string; stream: boolean },
  signal?: AbortSignal,
): Promise<Response> {
  const base = aggregatorBaseUrl()
  return fetch(`${base}/api/ai/generate`, {
    method: "POST",
    headers: proxyHeaders(),
    body: JSON.stringify(body),
    signal,
  })
}

export async function fetchAggregatorAiMiningDraft(
  body: {
    sentence: string
    target: string
    sourceLanguage?: string
    targetLanguage?: string
  },
  signal?: AbortSignal,
): Promise<Response> {
  const base = aggregatorBaseUrl()
  return fetch(`${base}/api/ai/mining-draft`, {
    method: "POST",
    headers: proxyHeaders(),
    body: JSON.stringify(body),
    signal,
  })
}

const PROXY_KEY = process.env.OLLAMA_PROXY_API_KEY?.trim() ?? ""

/**
 * Базовый URL Aggregator для серверных вызовов Next (BFF).
 * В Docker укажите внутренний адрес сервиса; для браузера по-прежнему NEXT_PUBLIC_API_URL.
 */
function aggregatorBaseUrl(): string {
  const internalUrl = process.env.AGGREGATOR_INTERNAL_URL?.trim()
  if (internalUrl) return internalUrl.replace(/\/$/, "")
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (pub) return pub.replace(/\/$/, "")
  return "http://127.0.0.1:5000"
}

/** Прокси Ollama через Aggregator включён, если задан OLLAMA_PROXY_API_KEY. */
export function isAggregatorOllamaProxyConfigured(): boolean {
  return PROXY_KEY.length > 0
}

const proxyHeaders = () => ({
  "Content-Type": "application/json",
  "X-Ollama-Proxy-Key": PROXY_KEY,
})

export async function fetchAggregatorOllamaModels(): Promise<Response> {
  const base = aggregatorBaseUrl()
  return fetch(`${base}/api/ollama/models`, {
    method: "GET",
    headers: { "X-Ollama-Proxy-Key": PROXY_KEY },
  })
}

export async function fetchAggregatorOllamaGenerate(
  body: { prompt: string; model?: string; stream?: boolean },
  signal?: AbortSignal,
): Promise<Response> {
  const base = aggregatorBaseUrl()
  return fetch(`${base}/api/ollama/generate`, {
    method: "POST",
    headers: proxyHeaders(),
    body: JSON.stringify(body),
    signal,
  })
}

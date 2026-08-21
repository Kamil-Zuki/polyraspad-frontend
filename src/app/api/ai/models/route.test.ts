import { expect, test, vi } from "vitest"
import { GET } from "./route"

vi.mock("@/lib/server/aggregator-ai-proxy", () => ({
  isAggregatorAiProxyConfigured: () => true,
  fetchAggregatorAiModels: vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ models: ["gpt-4o-mini"], provider: "openai-compatible" }), {
        status: 200,
      }),
    ),
  ),
}))

vi.mock("@/lib/server/editor-ai-provider", () => ({
  getEditorAiProvider: () => "aggregator",
  getConfiguredGeminiModelId: () => "gemini-2.0-flash",
}))

test("should return models from Aggregator AI proxy", async () => {
  const res = await GET()
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.models).toEqual(["gpt-4o-mini"])
  expect(data.provider).toBe("openai-compatible")
})

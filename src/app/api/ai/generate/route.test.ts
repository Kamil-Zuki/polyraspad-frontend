import { expect, test, vi } from "vitest"
import type { NextRequest } from "next/server"
import { POST } from "./route"

vi.mock("@/lib/server/aggregator-ai-proxy", () => ({
  isAggregatorAiProxyConfigured: () => true,
  fetchAggregatorAiGenerate: vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ response: "LLM generated this text", model: "gpt-4o-mini" }), {
        status: 200,
      }),
    ),
  ),
}))

vi.mock("@/lib/server/editor-ai-provider", () => ({
  getEditorAiProvider: () => "aggregator",
}))

function createRequest(body: Record<string, unknown>): NextRequest {
  return new Request("http://test/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

test("should return 400 when prompt is missing", async () => {
  const req = createRequest({})
  const res = await POST(req)
  expect(res.status).toBe(400)
  const data = await res.json()
  expect(data.error).toBe("Prompt is required")
})

test("should return 400 when prompt is empty string", async () => {
  const req = createRequest({ prompt: "   " })
  const res = await POST(req)
  expect(res.status).toBe(400)
})

test("should proxy to Aggregator AI and return response when prompt is valid", async () => {
  const req = createRequest({ prompt: "Say hello" })
  const res = await POST(req)
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.response).toBe("LLM generated this text")
})

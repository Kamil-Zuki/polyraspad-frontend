import { expect, test, vi, beforeEach } from "vitest"
import { POST } from "./route"

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (typeof url === "string" && url.includes("/api/tags")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ models: [{ name: "llama3.2" }] }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(JSON.stringify({ response: "Ollama generated this text" })),
      } as Response)
    }),
  )
})

function createRequest(body: Record<string, unknown>) {
  return new Request("http://test/api/ollama/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Request
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

test("should proxy to Ollama and return response when prompt is valid", async () => {
  const req = createRequest({ prompt: "Say hello" })
  const res = await POST(req)
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.response).toBe("Ollama generated this text")
})

test("should return 500 when Ollama returns error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Model not loaded"),
      } as Response),
    ),
  )

  const req = createRequest({ prompt: "test" })
  const res = await POST(req)
  expect(res.status).toBe(503)
  const data = await res.json()
  expect(data.error).toContain("Model not loaded")
})

test("should fallback to first available model when default model not found", async () => {
  let generateCalls = 0
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      if (typeof url === "string" && url.includes("/api/tags")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ models: [{ name: "llama3.2" }] }),
        } as Response)
      }
      if (typeof url === "string" && url.includes("/api/generate")) {
        generateCalls++
        if (generateCalls === 1) {
          return Promise.resolve({
            ok: false,
            status: 404,
            text: () => Promise.resolve("model 'qwen2.5-coder' not found"),
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(JSON.stringify({ response: "Fallback model response" })),
        } as Response)
      }
      return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve("") } as Response)
    }),
  )

  const req = createRequest({ prompt: "test" })
  const res = await POST(req)
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.response).toBe("Fallback model response")
})

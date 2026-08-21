import { expect, test, vi, beforeEach } from "vitest"
import { ollamaGenerate, ollamaListModels } from "./ollama-client"

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ response: "Generated text" })),
      } as Response),
    ),
  )
})

test("should return response text when API succeeds", async () => {
  const result = await ollamaGenerate({ prompt: "Test prompt" })
  expect(result).toBe("Generated text")
})

test("should send POST to /api/ai/generate with prompt", async () => {
  await ollamaGenerate({ prompt: "Hello" })
  expect(fetch).toHaveBeenCalledWith(
    "/api/ai/generate",
    expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "Hello",
        model: undefined,
        stream: false,
      }),
    }),
  )
})

test("should throw with error message when API returns non-2xx", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ error: "AI service unavailable" })),
      } as Response),
    ),
  )

  await expect(ollamaGenerate({ prompt: "x" })).rejects.toThrow("AI service unavailable")
})

test("should throw when response has empty error field", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({})),
      } as Response),
    ),
  )

  await expect(ollamaGenerate({ prompt: "x" })).rejects.toThrow("AI error: 500")
})

test("ollamaListModels returns model names when API succeeds", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ models: ["gpt-4o-mini", "gpt-4o"] }),
      } as Response),
    ),
  )

  const models = await ollamaListModels()
  expect(models).toEqual({ models: ["gpt-4o-mini", "gpt-4o"], provider: "openai-compatible" })
})

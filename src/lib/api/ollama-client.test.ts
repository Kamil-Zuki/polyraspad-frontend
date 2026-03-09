import { expect, test, vi, beforeEach } from "vitest"
import { ollamaGenerate, ollamaListModels } from "./ollama-client"

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ response: "Generated text" }),
      } as Response),
    ),
  )
})

test("should return response text when API succeeds", async () => {
  const result = await ollamaGenerate({ prompt: "Test prompt" })
  expect(result).toBe("Generated text")
})

test("should send POST to /api/ollama/generate with prompt", async () => {
  await ollamaGenerate({ prompt: "Hello" })
  expect(fetch).toHaveBeenCalledWith(
    "/api/ollama/generate",
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
        json: () => Promise.resolve({ error: "Ollama service unavailable" }),
      } as Response),
    ),
  )

  await expect(ollamaGenerate({ prompt: "x" })).rejects.toThrow(
    "Ollama service unavailable",
  )
})

test("should throw when response has empty error field", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response),
    ),
  )

  await expect(ollamaGenerate({ prompt: "x" })).rejects.toThrow("Ollama error: 500")
})

test("ollamaListModels returns model names when API succeeds", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ models: ["llama3.2", "qwen2.5-coder"] }),
      } as Response),
    ),
  )

  const models = await ollamaListModels()
  expect(models).toEqual(["llama3.2", "qwen2.5-coder"])
})

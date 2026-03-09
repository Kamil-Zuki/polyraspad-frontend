import { expect, test, vi, beforeEach } from "vitest"
import { GET } from "./route"

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            models: [
              { name: "llama3.2", model: "llama3.2" },
              { name: "qwen2.5-coder:7b", model: "qwen2.5-coder:7b" },
            ],
          }),
      } as Response),
    ),
  )
})

test("should return list of model names", async () => {
  const res = await GET()
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.models).toEqual(["llama3.2", "qwen2.5-coder:7b"])
})

test("should return empty models and error when Ollama fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Connection refused"),
      } as Response),
    ),
  )
  const res = await GET()
  expect(res.status).toBe(503)
  const data = await res.json()
  expect(data.models).toEqual([])
  expect(data.error).toBeDefined()
})

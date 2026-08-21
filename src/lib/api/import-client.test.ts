import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { startImport } from "./import-client"
import type { ImportConfig } from "./import-client"
import { API_ENDPOINTS } from "../constants"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const expectedUrl = `${API_BASE}${API_ENDPOINTS.CARDS.BULK_CREATE}`

describe("import-client", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          jobId: "job-123",
          status: "Accepted",
          message: "Import started",
          estimatedTimeSeconds: 30,
        }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      )
    )
  })

  afterEach(() => {
    fetchSpy?.mockRestore()
  })

  it("отправляет POST с FormData (file + config) на BULK_CREATE и возвращает jobId и status при 202", async () => {
    const file = new File(["col1,col2,col3"], "test.csv", { type: "text/csv" })
    const config: ImportConfig = {
      deckId: "deck-1",
      mapping: { sentence: 0, translation: 1, target: 2 },
      duplicateStrategy: "SKIP",
    }

    const result = await startImport(file, config)

    expect(result.jobId).toBe("job-123")
    expect(result.status).toBe("Accepted")
    expect(result.message).toBe("Import started")
    expect(result.estimatedTimeSeconds).toBe(30)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe(expectedUrl)
    expect(options?.method).toBe("POST")
    const body = options?.body as FormData
    expect(body).toBeInstanceOf(FormData)
    const appendedFile = body.get("file") as File
    expect(appendedFile).toBeInstanceOf(File)
    expect(appendedFile.name).toBe(file.name)
    expect(appendedFile.size).toBe(file.size)
    const configStr = body.get("config") as string
    expect(configStr).toBeTruthy()
    const parsed = JSON.parse(configStr as string)
    expect(parsed.deckId).toBe("deck-1")
    expect(parsed.mapping).toEqual({ sentence: 0, translation: 1, target: 2 })
    expect(parsed.duplicateStrategy).toBe("SKIP")
  })
})

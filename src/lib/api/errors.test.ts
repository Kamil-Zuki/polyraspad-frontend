import { expect, test } from "vitest"
import { ApiError } from "./errors"

test("should create ApiError with message and status", () => {
  const err = new ApiError("Not found", 404)
  expect(err.message).toBe("Not found")
  expect(err.status).toBe(404)
  expect(err.name).toBe("ApiError")
})

test("should create ApiError with optional detail and title", () => {
  const err = new ApiError("Validation failed", 400, "Invalid deckId", "Bad Request")
  expect(err.detail).toBe("Invalid deckId")
  expect(err.title).toBe("Bad Request")
})

test("should create ApiError from response using fromResponse", () => {
  const err = ApiError.fromResponse(
    { detail: "Deck not found", title: "Not Found" },
    404,
  )
  expect(err.message).toBe("Deck not found")
  expect(err.status).toBe(404)
  expect(err.detail).toBe("Deck not found")
  expect(err.title).toBe("Not Found")
})

test("should fall back to title when detail is missing", () => {
  const err = ApiError.fromResponse({ title: "Unauthorized" }, 401)
  expect(err.message).toBe("Unauthorized")
})

test("should fall back to message when detail and title missing", () => {
  const err = ApiError.fromResponse({ message: "Something went wrong" }, 500)
  expect(err.message).toBe("Something went wrong")
})

test("should fall back to Unknown error for empty response", () => {
  const err = ApiError.fromResponse({}, 500)
  expect(err.message).toBe("Unknown error")
})

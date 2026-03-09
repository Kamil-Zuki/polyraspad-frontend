import { expect, test } from "vitest"
import { getPreviewImageSrc } from "./media-preview-url"

test("should return serve-image URL when imageId is provided", () => {
  const result = getPreviewImageSrc({
    imageId: "img-123",
    apiBaseUrl: "http://localhost:5000",
  })
  expect(result).toBe(
    "http://localhost:5000/api/Media/serve-image?id=img-123",
  )
})

test("should trim imageId and encode in serve-image URL", () => {
  const result = getPreviewImageSrc({
    imageId: "  abc-def  ",
    apiBaseUrl: "https://api.example.com",
  })
  expect(result).toBe(
    "https://api.example.com/api/Media/serve-image?id=abc-def",
  )
})

test("should return empty string when no imageUrl and no imageId", () => {
  const result = getPreviewImageSrc({
    apiBaseUrl: "http://localhost:5000",
  })
  expect(result).toBe("")
})

test("should return data URL as-is", () => {
  const dataUrl = "data:image/png;base64,iVBORw0KGgo="
  const result = getPreviewImageSrc({
    imageUrl: dataUrl,
    apiBaseUrl: "http://localhost:5000",
  })
  expect(result).toBe(dataUrl)
})

test("should return blob URL as-is", () => {
  const blobUrl = "blob:http://localhost:3000/abc-123"
  const result = getPreviewImageSrc({
    imageUrl: blobUrl,
    apiBaseUrl: "http://localhost:5000",
  })
  expect(result).toBe(blobUrl)
})

test("should proxy cross-origin URL through serve-image", () => {
  const result = getPreviewImageSrc({
    imageUrl: "https://cdn.example.com/image.jpg",
    apiBaseUrl: "http://localhost:5000",
  })
  expect(result).toBe(
    "http://localhost:5000/api/Media/serve-image?url=" +
      encodeURIComponent("https://cdn.example.com/image.jpg"),
  )
})

test("should return same-origin URL as-is", () => {
  const result = getPreviewImageSrc({
    imageUrl: "http://localhost:5000/uploads/photo.jpg",
    apiBaseUrl: "http://localhost:5000",
  })
  expect(result).toBe("http://localhost:5000/uploads/photo.jpg")
})

test("should strip trailing slash from apiBaseUrl", () => {
  const result = getPreviewImageSrc({
    imageId: "x",
    apiBaseUrl: "http://localhost:5000/",
  })
  expect(result).toBe("http://localhost:5000/api/Media/serve-image?id=x")
})

/**
 * Returns the image URL to use for preview in the editor.
 * Prefers the backend serve-image endpoint (same origin, no CORS) when imageId is set
 * or when imageUrl is cross-origin.
 */
export function getPreviewImageSrc(options: {
  imageId?: string
  imageUrl?: string
  apiBaseUrl: string
}): string {
  const { imageId, imageUrl, apiBaseUrl } = options
  const base = apiBaseUrl.replace(/\/$/, "")

  if (imageId?.trim() && base) {
    return `${base}/api/Media/serve-image?id=${encodeURIComponent(imageId.trim())}`
  }

  if (!imageUrl?.trim()) {
    return ""
  }

  const url = imageUrl.trim()
  // data: and blob: URLs are usable directly in <img>; do not proxy (BFF cannot fetch them)
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url
  }
  try {
    const parsed = new URL(url)
    const apiOrigin = base ? new URL(base).origin : ""
    if (apiOrigin && parsed.origin !== apiOrigin) {
      return `${base}/api/Media/serve-image?url=${encodeURIComponent(url)}`
    }
  } catch {
    return url
  }

  return url
}

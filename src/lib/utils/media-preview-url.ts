const UUID_RE = /^[0-9a-f-]{36}$/i

export function isMediaImageUuid(value: string | undefined | null): boolean {
  return !!value?.trim() && UUID_RE.test(value.trim())
}

export interface ResolvedCardImagePreview {
  imageId?: string
  imageUrl?: string
  previewSrc: string
  fallbackSrc?: string
  hasImage: boolean
}

/**
 * Resolves card image preview from context imageId and/or raw Image note field.
 */
export function resolveCardImagePreview(options: {
  imageId?: string
  imageFieldValue?: string
  apiBaseUrl: string
}): ResolvedCardImagePreview {
  const raw = (options.imageFieldValue ?? "").trim()
  const contextId = options.imageId?.trim()
  const fromFieldUuid = raw && isMediaImageUuid(raw) ? raw : undefined
  const fromFieldUrl = raw && !isMediaImageUuid(raw) ? raw : undefined
  const resolvedId = contextId || fromFieldUuid
  const resolvedUrl = fromFieldUrl
  const previewSrc = getPreviewImageSrc({
    imageId: resolvedId,
    imageUrl: resolvedUrl,
    apiBaseUrl: options.apiBaseUrl,
  })
  const fallbackSrc = resolvedUrl || undefined
  return {
    imageId: resolvedId,
    imageUrl: resolvedUrl,
    previewSrc,
    fallbackSrc,
    hasImage: !!(previewSrc || fallbackSrc || resolvedId),
  }
}

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

const LOCAL_API_FALLBACK = "http://localhost:5000"
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"])

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}

function isLocalApiUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return LOCAL_HOSTNAMES.has(url.hostname)
  } catch {
    return false
  }
}

export function resolvePublicApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location
    const isLocalHost = LOCAL_HOSTNAMES.has(hostname)

    if (!isLocalHost) {
      if (envUrl && !isLocalApiUrl(envUrl)) {
        return trimTrailingSlash(envUrl)
      }

      if (hostname.startsWith("app.")) {
        return `${protocol}//api.${hostname.slice(4)}`
      }
    }
  }

  return trimTrailingSlash(envUrl || LOCAL_API_FALLBACK)
}

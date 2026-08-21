export function setLocaleCookie(locale: "en" | "ru") {
  document.cookie = `locale=${locale};path=/;max-age=31536000;SameSite=Lax`
}

export function getLocaleCookie(): "en" | "ru" | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/)
  const val = match ? decodeURIComponent(match[1]) : null
  if (val === "ru" || val === "en") return val
  return null
}

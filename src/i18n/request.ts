import { getRequestConfig } from "next-intl/server"
import { cookies, headers } from "next/headers"

export default getRequestConfig(async () => {
  const store = await cookies()
  const headerStore = await headers()

  const cookieLocale = store.get("locale")?.value
  const acceptLang = headerStore.get("accept-language")
  const browserLocale = acceptLang?.startsWith("ru") ? "ru" : "en"

  const locale = cookieLocale === "ru" || cookieLocale === "en" ? cookieLocale : browserLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useUserSettings } from "@/lib/react-query/queries"
import { setLocaleCookie, getLocaleCookie } from "@/i18n/locale-cookie"

export function useLocaleSync() {
  const router = useRouter()
  const currentLocale = useLocale()
  const { data: settings } = useUserSettings()

  useEffect(() => {
    if (!settings?.interfaceLanguage) return

    const target = settings.interfaceLanguage.toLowerCase()
    if (target !== "ru" && target !== "en") return

    const cookieVal = getLocaleCookie()
    if (cookieVal !== target || currentLocale !== target) {
      setLocaleCookie(target as "ru" | "en")
      router.refresh()
    }
  }, [settings?.interfaceLanguage, currentLocale, router])
}

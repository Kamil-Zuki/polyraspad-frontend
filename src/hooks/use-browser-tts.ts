"use client"

import { useState, useEffect, useCallback } from "react"
import type { TtsSettingsDto } from "@/lib/api/types"

/** Maps study target language strings (codes or names) to BCP 47 language tag prefixes */
export function getBcp47LangTag(targetLang?: string): string {
  if (!targetLang) return "en-US"
  const norm = targetLang.trim().toLowerCase()
  if (norm === "en" || norm === "english") return "en-US"
  if (norm === "ru" || norm === "russian") return "ru-RU"
  if (norm === "ko" || norm === "korean") return "ko-KR"
  if (norm === "ja" || norm === "japanese") return "ja-JP"
  if (norm === "es" || norm === "spanish") return "es-ES"
  if (norm === "de" || norm === "german") return "de-DE"
  if (norm === "fr" || norm === "french") return "fr-FR"
  if (norm === "zh" || norm === "chinese") return "zh-CN"
  if (norm === "it" || norm === "italian") return "it-IT"
  if (norm === "pt" || norm === "portuguese") return "pt-PT"
  // If already formatted like en-US or ko-KR or 2-letter code
  return targetLang
}

export interface UseBrowserTtsOptions {
  targetLang?: string
  ttsSettings?: TtsSettingsDto | null
}

export function useBrowserTts(options: UseBrowserTtsOptions = {}) {
  const { targetLang, ttsSettings } = options
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    const updateVoices = () => {
      const available = typeof window.speechSynthesis.getVoices === "function" ? window.speechSynthesis.getVoices() : []
      setVoices(available)
    }

    updateVoices()
    window.speechSynthesis.onvoiceschanged = updateVoices

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        typeof SpeechSynthesisUtterance === "undefined" ||
        !text.trim()
      ) {
        return
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }

      const utterance = new SpeechSynthesisUtterance(text.trim())
      const bcp47 = getBcp47LangTag(targetLang)
      utterance.lang = bcp47

      const rate = ttsSettings?.rate ?? 1.0
      const pitch = ttsSettings?.pitch ?? 1.0
      utterance.rate = Math.max(0.1, Math.min(10, rate))
      utterance.pitch = Math.max(0, Math.min(2, pitch))

      const availableVoices = typeof window.speechSynthesis.getVoices === "function" ? window.speechSynthesis.getVoices() : []
      if (availableVoices.length > 0) {
        let matchedVoice: SpeechSynthesisVoice | undefined

        if (ttsSettings?.voiceName) {
          matchedVoice = availableVoices.find((v) => v.name === ttsSettings.voiceName)
        }

        if (!matchedVoice && bcp47) {
          const langPrefix = bcp47.split("-")[0].toLowerCase()
          matchedVoice = availableVoices.find((v) =>
            v.lang.toLowerCase().startsWith(langPrefix)
          )
        }

        if (matchedVoice) {
          utterance.voice = matchedVoice
        }
      }

      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    },
    [targetLang, ttsSettings]
  )

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    speak,
    cancel,
    isSpeaking,
    availableVoices: voices,
  }
}

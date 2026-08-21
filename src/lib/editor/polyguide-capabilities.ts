import type { EditorAiBackend } from "@/lib/api/ollama-client"
import {
  DEFAULT_INTEGRATION_PREFERENCES,
  getEffectiveIntegrationLanguageProfile,
  loadIntegrationPreferences,
} from "@/lib/integrations/preferences"

export interface PolyGuideCapabilities {
  translator: { available: boolean; provider: string; hint?: string }
  dictionary: { available: boolean; provider: string; hint?: string }
  tts: { available: boolean; hint?: string }
  ai: { available: boolean; provider?: EditorAiBackend; model?: string; hint?: string }
}

export function resolvePolyGuideCapabilities(
  sourceLang: string,
  aiModels: string[] | null,
  aiProvider: EditorAiBackend | null,
  aiModel: string | null,
  aiError?: string | null,
): PolyGuideCapabilities {
  const prefs = loadIntegrationPreferences()
  const prof = getEffectiveIntegrationLanguageProfile(prefs, sourceLang)

  const translatorProvider =
    prof.translatorProvider?.trim() || DEFAULT_INTEGRATION_PREFERENCES.translatorProvider
  const dictionaryProvider =
    prof.dictionaryProvider?.trim() || DEFAULT_INTEGRATION_PREFERENCES.dictionaryProvider

  const aiAvailable = Boolean(aiModels && aiModels.length > 0 && !aiError)

  return {
    translator: {
      available: Boolean(translatorProvider),
      provider: translatorProvider,
      hint: translatorProvider ? undefined : "Configure a translator provider in Settings.",
    },
    dictionary: {
      available: Boolean(dictionaryProvider),
      provider: dictionaryProvider,
      hint: dictionaryProvider ? undefined : "Configure a dictionary provider in Settings.",
    },
    tts: {
      available: true,
      hint: "Uses server TTS. May fail if Media service is unavailable.",
    },
    ai: {
      available: aiAvailable,
      provider: aiProvider ?? undefined,
      model: aiModel ?? undefined,
      hint: aiAvailable
        ? undefined
        : aiError ?? "AI agent is unavailable. Basic translator and dictionary tools still work.",
    },
  }
}

import { EDITOR_DEFAULT_AI_MODEL } from "@/lib/api/ollama-client"
import type { CopilotLanguageCode } from "@/lib/api/types"
import { resolveCopilotLanguage } from "@/lib/integrations/preferences"

const STORAGE_KEY = "pvs-studio-ai-model-v2"

export type AiModelPreference = {
  /** Model id passed to /api/ai/generate (must exist in provider list when override allowed). */
  modelId: string
  /** Optional override per PolyGuide language (en | ru | ko). */
  profiles?: Partial<Record<CopilotLanguageCode, string>>
}

function migrateLegacyV1(): AiModelPreference | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem("pvs-studio-ai-model-v1")
    if (!raw) return null
    const parsed = JSON.parse(raw) as { modelId?: string }
    const modelId = (parsed.modelId || "").trim()
    window.localStorage.removeItem("pvs-studio-ai-model-v1")
    return { modelId: modelId || EDITOR_DEFAULT_AI_MODEL, profiles: {} }
  } catch {
    return null
  }
}

export function defaultAiModelPreference(): AiModelPreference {
  return { modelId: EDITOR_DEFAULT_AI_MODEL, profiles: {} }
}

export function loadAiModelPreference(): AiModelPreference {
  if (typeof window === "undefined") {
    return defaultAiModelPreference()
  }
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const migrated = migrateLegacyV1()
      if (migrated) {
        saveAiModelPreference(migrated)
        return migrated
      }
      return defaultAiModelPreference()
    }
    const parsed = JSON.parse(raw) as Partial<AiModelPreference>
    const modelId = (parsed.modelId || "").trim() || EDITOR_DEFAULT_AI_MODEL
    const profiles: Partial<Record<CopilotLanguageCode, string>> = {}
    const pr = parsed.profiles
    if (pr?.en?.trim()) profiles.en = pr.en.trim()
    if (pr?.ru?.trim()) profiles.ru = pr.ru.trim()
    if (pr?.ko?.trim()) profiles.ko = pr.ko.trim()
    return { modelId, profiles }
  } catch {
    return defaultAiModelPreference()
  }
}

export function saveAiModelPreference(next: AiModelPreference): void {
  if (typeof window === "undefined") return
  const modelId = (next.modelId || "").trim() || EDITOR_DEFAULT_AI_MODEL
  const profiles: Partial<Record<CopilotLanguageCode, string>> = {}
  if (next.profiles?.en?.trim()) profiles.en = next.profiles.en.trim()
  if (next.profiles?.ru?.trim()) profiles.ru = next.profiles.ru.trim()
  if (next.profiles?.ko?.trim()) profiles.ko = next.profiles.ko.trim()
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ modelId, profiles }))
}

/** Model id used by PolyGuide for the current study language. */
export function resolvePreferredAiModelId(languageHint: string | undefined | null): string {
  const lang = resolveCopilotLanguage(languageHint)
  const pref = loadAiModelPreference()
  const byLang = pref.profiles?.[lang]?.trim()
  if (byLang) return byLang
  return pref.modelId || EDITOR_DEFAULT_AI_MODEL
}

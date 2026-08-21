/** Persisted pair for Reader + Create card translation flows (independent of project metadata). */
export interface StudyLanguagePair {
  sourceLanguage: string
  targetLanguage: string
}

export const STUDY_LANGUAGE_STORAGE_KEY = "polyraspad.studyLanguages.v1"

export const STUDY_LANGUAGE_PRESETS: readonly { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Russian" },
  { code: "ko", label: "Korean" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
] as const

export function normalizeStudyLanguageCode(code: string | undefined | null): string {
  const trimmed = (code ?? "").trim().toLowerCase()
  if (!trimmed) return ""
  // ISO-like codes; cap length to avoid junk in API payloads
  return trimmed.slice(0, 16)
}

export function loadStudyLanguagePair(): StudyLanguagePair {
  if (typeof window === "undefined") {
    return { sourceLanguage: "en", targetLanguage: "ru" }
  }
  try {
    const raw = window.localStorage.getItem(STUDY_LANGUAGE_STORAGE_KEY)
    if (!raw) return { sourceLanguage: "en", targetLanguage: "ru" }
    const parsed = JSON.parse(raw) as Partial<StudyLanguagePair>
    const sourceLanguage = normalizeStudyLanguageCode(parsed.sourceLanguage) || "en"
    const targetLanguage = normalizeStudyLanguageCode(parsed.targetLanguage) || "ru"
    return { sourceLanguage, targetLanguage }
  } catch {
    return { sourceLanguage: "en", targetLanguage: "ru" }
  }
}

export function saveStudyLanguagePair(pair: StudyLanguagePair): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      STUDY_LANGUAGE_STORAGE_KEY,
      JSON.stringify({
        sourceLanguage: normalizeStudyLanguageCode(pair.sourceLanguage) || "en",
        targetLanguage: normalizeStudyLanguageCode(pair.targetLanguage) || "ru",
      }),
    )
  } catch {
    /* ignore quota / private mode */
  }
}

/** Returns a user-facing validation message when translation should not run. */
export function validateDistinctStudyLanguages(source: string, target: string): string | null {
  const src = normalizeStudyLanguageCode(source)
  const tgt = normalizeStudyLanguageCode(target)
  if (!src || !tgt) {
    return "Pick both source and target language codes before translating."
  }
  if (src === tgt) {
    return "Choose two different languages before translating (source and target cannot match)."
  }
  return null
}

export function presetLabelForCode(code: string): string {
  const norm = normalizeStudyLanguageCode(code)
  if (!norm) return "(unset)"
  const hit = STUDY_LANGUAGE_PRESETS.find((p) => p.code === norm)
  return hit?.label ?? norm.toUpperCase()
}

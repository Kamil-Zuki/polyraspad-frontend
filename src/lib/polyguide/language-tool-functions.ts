import { apiClient } from "@/lib/api"
import type { CardFieldPatch } from "@/lib/editor/card-field-patch"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import {
  getEffectiveIntegrationLanguageProfile,
  loadIntegrationPreferences,
} from "@/lib/integrations/preferences"

export interface DictionaryLookupResult {
  patch: CardFieldPatch
  provider: string
  word: string
}

export async function translateTextWithIntegrations(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  const prefs = loadIntegrationPreferences()
  const prof = getEffectiveIntegrationLanguageProfile(prefs, sourceLang)
  const translated = await apiClient.integrations.translate({
    text,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    provider: prof.translatorProvider,
  })
  return translated.translatedText
}

export async function lookupDictionaryForWord(
  word: string,
  sourceLang: string,
  existingNotes = "",
): Promise<DictionaryLookupResult> {
  const prefs = loadIntegrationPreferences()
  const prof = getEffectiveIntegrationLanguageProfile(prefs, sourceLang)
  const lookup = await apiClient.integrations.lookupDictionary({
    word,
    language: sourceLang,
    provider: prof.dictionaryProvider,
  })

  const topLines = lookup.meanings
    .slice(0, 3)
    .map((meaning) => {
      const sample = meaning.definitions.slice(0, 2).join("; ")
      return meaning.partOfSpeech ? `${meaning.partOfSpeech}: ${sample}` : sample
    })
    .filter(Boolean)

  if (topLines.length === 0) {
    throw new Error("No dictionary definitions found for this word.")
  }

  const patch: CardFieldPatch = {
    [SENTENCE_MINING.Definition]: topLines.join("\n"),
  }
  const first = lookup.meanings[0]
  if (first?.partOfSpeech) patch[SENTENCE_MINING.WordTypes] = first.partOfSpeech
  if (lookup.phonetic?.trim()) patch[SENTENCE_MINING.Transcription] = lookup.phonetic.trim()

  return { patch, provider: lookup.provider, word: lookup.word }
}

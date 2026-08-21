import { generateAudio } from "@/lib/api/media-client"
import { EDITOR_DEFAULT_AI_MODEL } from "@/lib/api/ollama-client"
import type { NoteFieldValueDto } from "@/lib/api/types"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { runBuildCardAgent, type AgentContext } from "@/lib/editor/polyguide-agent"
import { resolveCopilotLanguage } from "@/lib/integrations/preferences"
import {
  lookupDictionaryForWord,
  translateTextWithIntegrations,
} from "@/lib/polyguide/language-tool-functions"

export interface QuickAddInput {
  term: string
  sourceLang: string
  targetLang: string
}

export async function buildQuickAddCardPatch(
  input: QuickAddInput,
): Promise<Record<string, string>> {
  const { term, sourceLang, targetLang } = input

  const fieldValues: Record<string, string> = {
    [SENTENCE_MINING.Expression]: term,
    [SENTENCE_MINING.Word]: term,
  }

  const ctx: AgentContext = {
    fieldValues,
    sourceLang,
    targetLang,
    ollamaModel: EDITOR_DEFAULT_AI_MODEL,
    translateWithTranslator: async () => {
      const translated = await translateTextWithIntegrations(term, sourceLang, targetLang)
      return { [SENTENCE_MINING.Translation]: translated }
    },
    lookupDictionary: async (wordOverride) => {
      const result = await lookupDictionaryForWord(wordOverride ?? term, sourceLang, "")
      return result.patch
    },
    generateCardAudio: async () => {
      const result = await generateAudio({
        text: term.slice(0, 4000),
        language: resolveCopilotLanguage(sourceLang),
      })
      return { [SENTENCE_MINING.Audio]: result.url }
    },
  }

  const patch = await runBuildCardAgent(ctx)
  return { ...fieldValues, ...patch }
}

export function patchToCreateCardFieldValues(
  patch: Record<string, string>,
): Record<string, NoteFieldValueDto> {
  const fieldValues: Record<string, NoteFieldValueDto> = {}
  for (const [key, value] of Object.entries(patch)) {
    const trimmed = value.trim()
    if (!trimmed) continue
    fieldValues[key] = { stringValue: trimmed }
  }
  return fieldValues
}

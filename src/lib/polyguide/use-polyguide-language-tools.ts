"use client"

import { useCallback, useEffect, useState } from "react"
import {
  EDITOR_DEFAULT_AI_MODEL,
  ollamaListModels,
  resolveEditorOllamaModel,
  type EditorAiBackend,
} from "@/lib/api/ollama-client"
import { loadAiModelPreference, resolvePreferredAiModelId } from "@/lib/studio/ai-model-preferences"
import {
  lookupDictionaryForWord,
  translateTextWithIntegrations,
} from "@/lib/polyguide/language-tool-functions"
import type { CardFieldPatch } from "@/lib/editor/card-field-patch"

export interface PolyGuideLanguageTools {
  sourceLang: string
  targetLang: string
  ollamaModel: string
  aiModels: string[]
  aiProvider: EditorAiBackend
  aiLoadError: string | null
  translateText: (text: string) => Promise<string>
  lookupDictionary: (word: string, existingNotes?: string) => Promise<CardFieldPatch>
}

export function usePolyGuideLanguageTools(
  sourceLang: string,
  targetLang: string,
): PolyGuideLanguageTools {
  const [ollamaModel, setOllamaModel] = useState(EDITOR_DEFAULT_AI_MODEL)
  const [aiModels, setAiModels] = useState<string[]>([])
  const [aiProvider, setAiProvider] = useState<EditorAiBackend>("openai-compatible")
  const [aiLoadError, setAiLoadError] = useState<string | null>(null)

  useEffect(() => {
    const saved = loadAiModelPreference()
    ollamaListModels()
      .then(({ models, provider }) => {
        setAiProvider(provider)
        setAiModels(models)
        setAiLoadError(null)
        const preferred = resolvePreferredAiModelId(sourceLang)
        setOllamaModel(
          resolveEditorOllamaModel(models, preferred || saved.modelId || EDITOR_DEFAULT_AI_MODEL),
        )
      })
      .catch((e) => {
        setAiProvider("openai-compatible")
        setAiModels([])
        setAiLoadError(e instanceof Error ? e.message : "AI unavailable")
        setOllamaModel(resolvePreferredAiModelId(sourceLang) || saved.modelId || EDITOR_DEFAULT_AI_MODEL)
      })
  }, [sourceLang])

  const translateText = useCallback(
    async (text: string) => translateTextWithIntegrations(text, sourceLang, targetLang),
    [sourceLang, targetLang],
  )

  const lookupDictionary = useCallback(
    async (word: string, existingNotes = "") => {
      const result = await lookupDictionaryForWord(word, sourceLang, existingNotes)
      return result.patch
    },
    [sourceLang],
  )

  return {
    sourceLang,
    targetLang,
    ollamaModel,
    aiModels,
    aiProvider,
    aiLoadError,
    translateText,
    lookupDictionary,
  }
}

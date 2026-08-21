"use client"

import { useCallback, useRef, useState } from "react"
import { useEditorCard } from "@/contexts/editor-card-context"
import { useEditorLanguage } from "@/contexts/editor-language-context"
import type { CardFieldPatch } from "@/lib/editor/card-field-patch"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { ollamaGenerate, resolveEditorOllamaModel } from "@/lib/api/ollama-client"
import {
  runDictionaryAiAgent,
  runExplainWordAgent,
  runGenerateExampleAgent,
  runGrammarAgent,
  runImageSuggestionAgent,
} from "@/lib/editor/polyguide-agent"
import {
  appendNotesValue,
  buildExampleFieldPatch,
  buildPlaceholderImageUrl,
} from "@/lib/editor/polyguide-card-patches"
import { loadAiModelPreference, resolvePreferredAiModelId } from "@/lib/studio/ai-model-preferences"

export interface EditorAiActionsState {
  isAiBusy: boolean
  aiError: string | null
  clearAiError: () => void
  explainGrammar: () => Promise<string | null>
  generateExample: () => Promise<CardFieldPatch | null>
  suggestImage: () => Promise<CardFieldPatch | null>
  defineWithAi: () => Promise<CardFieldPatch | null>
  aiTranslate: () => Promise<CardFieldPatch | null>
  explainWord: () => Promise<string | null>
}

function useOllamaModel() {
  const { sourceLang } = useEditorLanguage()
  const [ollamaModel, setOllamaModel] = useState(() => {
    const saved = loadAiModelPreference()
    return resolvePreferredAiModelId(sourceLang) || saved.modelId
  })

  const resolveModel = useCallback(
    (models: string[]) => resolveEditorOllamaModel(models, ollamaModel),
    [ollamaModel],
  )

  return { ollamaModel, setOllamaModel, resolveModel }
}

export function useEditorAiActions(): EditorAiActionsState {
  const { sourceLang, targetLang } = useEditorLanguage()
  const { sentence, targetWord, translation, notes, example } = useEditorCard()
  const [isAiBusy, setIsAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  const { ollamaModel } = useOllamaModel()

  const clearAiError = useCallback(() => setAiError(null), [])

  const wrap = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      if (inFlightRef.current) return null
      inFlightRef.current = true
      setIsAiBusy(true)
      setAiError(null)
      try {
        return await fn()
      } catch (e) {
        setAiError(e instanceof Error ? e.message : "AI action failed.")
        return null
      } finally {
        inFlightRef.current = false
        setIsAiBusy(false)
      }
    },
    [],
  )

  const explainGrammar = useCallback(async (): Promise<string | null> => {
    const word = targetWord.trim()
    if (!word) {
      setAiError("Enter or highlight a target word first.")
      return null
    }
    return wrap(() => runGrammarAgent(word, sentence.trim(), translation.trim(), sourceLang, targetLang, ollamaModel))
  }, [targetWord, sentence, translation, sourceLang, targetLang, ollamaModel, wrap])

  const explainWord = useCallback(async (): Promise<string | null> => {
    const word = targetWord.trim()
    if (!word) {
      setAiError("Enter or highlight a target word first.")
      return null
    }
    return wrap(() => runExplainWordAgent(word, sentence.trim(), translation.trim(), sourceLang, targetLang, ollamaModel))
  }, [targetWord, sentence, translation, sourceLang, targetLang, ollamaModel, wrap])

  const generateExample = useCallback(async (): Promise<CardFieldPatch | null> => {
    const word = targetWord.trim()
    if (!word) {
      setAiError("Enter or highlight a target word first.")
      return null
    }
    return wrap(async () => {
      const ex = await runGenerateExampleAgent(word, sourceLang, targetLang, ollamaModel)
      return buildExampleFieldPatch(sourceLang, targetLang, ex)
    })
  }, [targetWord, sourceLang, targetLang, ollamaModel, wrap])

  const suggestImage = useCallback(async (): Promise<CardFieldPatch | null> => {
    const word = targetWord.trim()
    if (!word) {
      setAiError("Enter or highlight a target word first.")
      return null
    }
    return wrap(async () => {
      let query: string
      try {
        query = await runImageSuggestionAgent(word, sourceLang, ollamaModel)
      } catch {
        query = `"${word}" vocabulary`
      }
      return { [SENTENCE_MINING.Image]: buildPlaceholderImageUrl(word, query) }
    })
  }, [targetWord, sourceLang, ollamaModel, wrap])

  const defineWithAi = useCallback(async (): Promise<CardFieldPatch | null> => {
    const word = targetWord.trim()
    if (!word) {
      setAiError("Enter or highlight a target word first.")
      return null
    }
    return wrap(() =>
      runDictionaryAiAgent(word, sentence.trim(), translation.trim(), sourceLang, targetLang, ollamaModel),
    )
  }, [targetWord, sentence, translation, sourceLang, targetLang, ollamaModel, wrap])

  const aiTranslate = useCallback(async (): Promise<CardFieldPatch | null> => {
    const s = sentence.trim()
    if (!s) {
      setAiError("Enter a sentence to translate.")
      return null
    }
    return wrap(async () => {
      const srcName = sourceLang
      const tgtName = targetLang
      const w = targetWord.trim()
      const targetHint = w
        ? `Focus word or phrase (surface form in ${srcName}): "${w}".`
        : `Translate the whole sentence naturally (${srcName}).`
      const prompt = `You are a translator for vocabulary flashcards.
Source language (${srcName}): """${s}"""
Learner-facing explanation language (${tgtName}): output must be written entirely in ${tgtName}.
${targetHint}
Task: Output ONE concise ${tgtName} line: the meaning of the sentence in context (how the focus word is used, if given).
Rules: ${tgtName} only. No quotes around the answer. No labels like "Translation:".`

      const text = await ollamaGenerate({ prompt, model: ollamaModel, stream: false })
      const cleaned = text
        .trim()
        .replace(/^(translation|перевод)\s*[:：]\s*/i, "")
        .replace(/^["'`«»]+|["'`«»]+$/g, "")
        .trim()

      if (!cleaned) {
        throw new Error("The model returned an empty translation.")
      }
      return { [SENTENCE_MINING.Translation]: cleaned }
    })
  }, [sentence, targetWord, sourceLang, targetLang, ollamaModel, wrap])

  return {
    isAiBusy,
    aiError,
    clearAiError,
    explainGrammar,
    generateExample,
    suggestImage,
    defineWithAi,
    aiTranslate,
    explainWord,
  }
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  formatGenerateAudioUserMessage,
  generateAudio,
} from "@/lib/api/media-client"
import {
  lookupDictionaryForWord,
  translateTextWithIntegrations,
} from "@/lib/polyguide/language-tool-functions"
import {
  EDITOR_DEFAULT_AI_MODEL,
  ollamaGenerate,
  ollamaListModels,
  resolveEditorOllamaModel,
  type EditorAiBackend,
} from "@/lib/api/ollama-client"
import { useEditorCard } from "@/contexts/editor-card-context"
import { useEditorLanguage } from "@/contexts/editor-language-context"
import type { CardFieldPatch } from "@/lib/editor/card-field-patch"
import { partitionPatch } from "@/lib/editor/card-field-patch"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { resolveCopilotLanguage } from "@/lib/integrations/preferences"
import { loadAiModelPreference, resolvePreferredAiModelId } from "@/lib/studio/ai-model-preferences"
import { presetLabelForCode } from "@/lib/languages/study-language-preferences"
import { runBuildCardAgent } from "@/lib/editor/polyguide-agent"

function displayLanguageName(code: string) {
  return presetLabelForCode(code)
}

export interface EditorCardToolsState {
  isTranslating: boolean
  isLookingUpDictionary: boolean
  isGeneratingAudio: boolean
  isAutoFilling: boolean
  isAiBusy: boolean
  lastError: string | null
  editorAiProvider: EditorAiBackend
  ollamaModel: string
  aiModels: string[]
  aiLoadError: string | null
  clearError: () => void
  translateWithTranslator: (options?: { proposeOnly?: boolean }) => Promise<CardFieldPatch | null>
  translateWithAi: (options?: { proposeOnly?: boolean }) => Promise<CardFieldPatch | null>
  lookupDictionary: (wordOverride?: string, options?: { proposeOnly?: boolean }) => Promise<CardFieldPatch | null>
  generateCardAudio: (options?: { proposeOnly?: boolean }) => Promise<CardFieldPatch | null>
  autoFillCard: () => Promise<{ applied: CardFieldPatch; staged: CardFieldPatch } | null>
}

export function useEditorCardTools(): EditorCardToolsState {
  const { sourceLang, targetLang, studyLangConflictMessage } = useEditorLanguage()
  const {
    fieldValues,
    sentence,
    targetWord,
    translation,
    notes,
    definition,
    mergeFieldValues,
    setTranslation,
    setDefinition,
    setWordTypes,
    setTranscription,
    setNotes,
    setAudioUrl,
  } = useEditorCard()

  const [isTranslating, setIsTranslating] = useState(false)
  const [isLookingUpDictionary, setIsLookingUpDictionary] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [isAiBusy, setIsAiBusy] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [editorAiProvider, setEditorAiProvider] = useState<EditorAiBackend>("openai-compatible")
  const [ollamaModel, setOllamaModel] = useState(EDITOR_DEFAULT_AI_MODEL)
  const [aiModels, setAiModels] = useState<string[]>([])
  const [aiLoadError, setAiLoadError] = useState<string | null>(null)
  const audioInFlightRef = useRef(false)
  const autoFillInFlightRef = useRef(false)

  const clearError = useCallback(() => setLastError(null), [])

  useEffect(() => {
    const saved = loadAiModelPreference()
    ollamaListModels()
      .then(({ models, provider }) => {
        setEditorAiProvider(provider)
        setAiModels(models)
        setAiLoadError(null)
        const preferred = resolvePreferredAiModelId(sourceLang)
        setOllamaModel(resolveEditorOllamaModel(models, preferred || saved.modelId || EDITOR_DEFAULT_AI_MODEL))
      })
      .catch((e) => {
        setEditorAiProvider("openai-compatible")
        setAiModels([])
        setAiLoadError(e instanceof Error ? e.message : "AI unavailable")
        setOllamaModel(resolvePreferredAiModelId(sourceLang) || saved.modelId || EDITOR_DEFAULT_AI_MODEL)
      })
  }, [sourceLang])

  const translateWithTranslator = useCallback(async (options?: { proposeOnly?: boolean }): Promise<CardFieldPatch | null> => {
    if (isTranslating) return null
    if (studyLangConflictMessage) {
      setLastError(studyLangConflictMessage)
      return null
    }
    const sourceSentence = sentence.trim()
    if (!sourceSentence) {
      setLastError("Enter a sentence to translate.")
      return null
    }

    setLastError(null)
    setIsTranslating(true)
    try {
      const translatedText = await translateTextWithIntegrations(
        sourceSentence,
        sourceLang,
        targetLang,
      )
      const patch = { [SENTENCE_MINING.Translation]: translatedText }
      if (!options?.proposeOnly) setTranslation(translatedText)
      return patch
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Translation failed.")
      return null
    } finally {
      setIsTranslating(false)
    }
  }, [isTranslating, studyLangConflictMessage, sentence, sourceLang, targetLang, setTranslation])

  const translateWithAi = useCallback(async (options?: { proposeOnly?: boolean }): Promise<CardFieldPatch | null> => {
    if (isTranslating || isAiBusy) return null
    if (studyLangConflictMessage) {
      setLastError(studyLangConflictMessage)
      return null
    }
    const s = sentence.trim()
    if (!s) {
      setLastError("Enter a sentence to translate.")
      return null
    }

    setLastError(null)
    setIsTranslating(true)
    setIsAiBusy(true)
    try {
      const srcName = displayLanguageName(sourceLang)
      const tgtName = displayLanguageName(targetLang)
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
        setLastError("The model returned an empty translation.")
        return null
      }
      const patch = { [SENTENCE_MINING.Translation]: cleaned }
      if (!options?.proposeOnly) setTranslation(cleaned)
      return patch
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "AI translate failed.")
      return null
    } finally {
      setIsTranslating(false)
      setIsAiBusy(false)
    }
  }, [
    isTranslating,
    isAiBusy,
    studyLangConflictMessage,
    sentence,
    targetWord,
    sourceLang,
    targetLang,
    ollamaModel,
    setTranslation,
  ])

  const lookupDictionary = useCallback(
    async (wordOverride?: string, options?: { proposeOnly?: boolean }): Promise<CardFieldPatch | null> => {
      if (isLookingUpDictionary) return null
      const word = (wordOverride ?? targetWord).trim()
      if (!word) {
        setLastError("Enter or highlight a target word first.")
        return null
      }

      setLastError(null)
      setIsLookingUpDictionary(true)
      try {
        const lookup = await lookupDictionaryForWord(word, sourceLang, notes)
        const patch: CardFieldPatch = { ...lookup.patch }

        if (!options?.proposeOnly) {
          if (patch[SENTENCE_MINING.Definition] !== undefined) setDefinition(patch[SENTENCE_MINING.Definition]!)
          if (patch[SENTENCE_MINING.WordTypes] !== undefined) setWordTypes(patch[SENTENCE_MINING.WordTypes]!)
          if (patch[SENTENCE_MINING.Transcription] !== undefined) setTranscription(patch[SENTENCE_MINING.Transcription]!)
          if (patch[SENTENCE_MINING.Notes] !== undefined) setNotes(patch[SENTENCE_MINING.Notes]!)
        }
        return patch
      } catch (e) {
        setLastError(e instanceof Error ? e.message : "Dictionary lookup failed.")
        return null
      } finally {
        setIsLookingUpDictionary(false)
      }
    },
    [
      isLookingUpDictionary,
      targetWord,
      sourceLang,
      notes,
      setDefinition,
      setWordTypes,
      setTranscription,
      setNotes,
    ],
  )

  const generateCardAudio = useCallback(async (options?: { proposeOnly?: boolean }): Promise<CardFieldPatch | null> => {
    if (audioInFlightRef.current) return null
    const textForSpeech = sentence.trim() || targetWord.trim()
    if (!textForSpeech) {
      setLastError("Enter a word or expression to synthesize speech.")
      return null
    }

    setLastError(null)
    audioInFlightRef.current = true
    setIsGeneratingAudio(true)
    try {
      const copilotLang = resolveCopilotLanguage(sourceLang)
      const result = await generateAudio({
        text: textForSpeech.slice(0, 4000),
        language: copilotLang,
      })
      const url = result?.url?.trim() ?? ""
      if (!url) {
        setLastError("Audio generation returned no URL.")
        return null
      }
      if (!options?.proposeOnly) setAudioUrl(url)
      return { [SENTENCE_MINING.Audio]: url }
    } catch (e) {
      setLastError(formatGenerateAudioUserMessage(e))
      return null
    } finally {
      audioInFlightRef.current = false
      setIsGeneratingAudio(false)
    }
  }, [targetWord, sentence, sourceLang, setAudioUrl])

  const autoFillCard = useCallback(async (): Promise<{ applied: CardFieldPatch; staged: CardFieldPatch } | null> => {
    if (autoFillInFlightRef.current) return null
    if (studyLangConflictMessage) {
      setLastError(studyLangConflictMessage)
      return null
    }
    const word = targetWord.trim()
    if (!word) {
      setLastError("Enter or highlight a target word first.")
      return null
    }
    const sourceSentence = sentence.trim()
    if (!sourceSentence) {
      setLastError("Enter an expression first.")
      return null
    }

    setLastError(null)
    autoFillInFlightRef.current = true
    setIsAutoFilling(true)
    try {
      const patch = await runBuildCardAgent({
        fieldValues,
        sourceLang,
        targetLang,
        ollamaModel,
        translateWithTranslator,
        lookupDictionary,
        generateCardAudio,
      })
      const { applied, staged } = partitionPatch(fieldValues, patch)
      if (Object.keys(applied).length > 0) {
        mergeFieldValues(applied)
      }
      return { applied, staged }
    } catch (e) {
      setLastError(e instanceof Error ? e.message : "Auto-fill failed.")
      return null
    } finally {
      autoFillInFlightRef.current = false
      setIsAutoFilling(false)
    }
  }, [
    studyLangConflictMessage,
    targetWord,
    sentence,
    fieldValues,
    sourceLang,
    targetLang,
    ollamaModel,
    translateWithTranslator,
    lookupDictionary,
    generateCardAudio,
    mergeFieldValues,
  ])

  return {
    isTranslating,
    isLookingUpDictionary,
    isGeneratingAudio,
    isAutoFilling,
    isAiBusy,
    lastError,
    editorAiProvider,
    ollamaModel,
    aiModels,
    aiLoadError,
    clearError,
    translateWithTranslator,
    translateWithAi,
    lookupDictionary,
    generateCardAudio,
    autoFillCard,
  }
}

"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { CardTemplateDto } from "@/lib/api/types"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

/** Flat UI state kept for backward compatibility with hooks and helpers — maps to `Sentence Mining` field keys. */
export interface EditorCardState {
  sentence: string
  targetWord: string
  translation: string
  notes: string
  transcription: string
  wordTypes: string
  definition: string
  example: string
  synonymsText: string
  antonyms: string
  imageUrl: string
  imageId: string
  audioUrl: string
}

export interface EditorCardContextType {
  /** Raw Anki-like field values keyed by FieldKey (e.g. Expression, Word). */
  fieldValues: Record<string, string>
  /** Set a single template field (Sentence Mining keys or custom note type keys). */
  setFieldValue: (fieldKey: string, value: string) => void
  mergeFieldValues: (patch: Record<string, string>) => void
  /** Template used in card preview (front/back). */
  activeCardTemplate: CardTemplateDto | null
  setActiveCardTemplate: (t: CardTemplateDto | null) => void

  /** @deprecated use fieldValues + sentence mining keys — kept for existing components */
  sentence: string
  targetWord: string
  translation: string
  notes: string
  transcription: string
  wordTypes: string
  definition: string
  example: string
  synonymsText: string
  antonyms: string
  imageUrl: string
  imageId: string
  audioUrl: string
  setSentence: (v: string) => void
  setTargetWord: (v: string) => void
  setTranslation: (v: string) => void
  setNotes: (v: string) => void
  setTranscription: (v: string) => void
  setWordTypes: (v: string) => void
  setDefinition: (v: string) => void
  setExample: (v: string) => void
  setSynonymsText: (v: string) => void
  setAntonyms: (v: string) => void
  setImageUrl: (v: string) => void
  setImageId: (v: string) => void
  setAudioUrl: (v: string) => void
  /** Merge legacy flat state into fieldValues (hydration). */
  setCardState: (patch: Partial<EditorCardState>) => void
  resetEditorFields: () => void
}

const EditorCardContext = createContext<EditorCardContextType | undefined>(undefined)

const SM = SENTENCE_MINING

export function EditorCardProvider({
  children,
  initialFieldValues,
}: {
  children: ReactNode
  initialFieldValues?: Record<string, string>
}) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(initialFieldValues ?? {})
  const [imageId, setImageId] = useState("")
  const [activeCardTemplate, setActiveCardTemplate] = useState<CardTemplateDto | null>(null)

  const setFieldValue = useCallback((fieldKey: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldKey]: value }))
  }, [])

  const mergeFieldValues = useCallback((patch: Record<string, string>) => {
    setFieldValues((prev) => ({ ...prev, ...patch }))
  }, [])

  const sentence = fieldValues[SM.Expression] ?? ""
  const targetWord = fieldValues[SM.Word] ?? ""
  const translation = fieldValues[SM.Translation] ?? ""
  const notes = fieldValues[SM.Notes] ?? ""
  const transcription = fieldValues[SM.Transcription] ?? ""
  const wordTypes = fieldValues[SM.WordTypes] ?? ""
  const definition = fieldValues[SM.Definition] ?? ""
  const example = fieldValues[SM.Example] ?? ""
  const synonymsText = fieldValues[SM.Synonyms] ?? ""
  const antonyms = fieldValues[SM.Antonyms] ?? ""
  const imageUrl = fieldValues[SM.Image] ?? ""
  const audioUrl = fieldValues[SM.Audio] ?? ""

  const setSentence = useCallback((v: string) => setFieldValue(SM.Expression, v), [setFieldValue])
  const setTargetWord = useCallback((v: string) => setFieldValue(SM.Word, v), [setFieldValue])
  const setTranslation = useCallback((v: string) => setFieldValue(SM.Translation, v), [setFieldValue])
  const setNotes = useCallback((v: string) => setFieldValue(SM.Notes, v), [setFieldValue])
  const setTranscription = useCallback((v: string) => setFieldValue(SM.Transcription, v), [setFieldValue])
  const setWordTypes = useCallback((v: string) => setFieldValue(SM.WordTypes, v), [setFieldValue])
  const setDefinition = useCallback((v: string) => setFieldValue(SM.Definition, v), [setFieldValue])
  const setExample = useCallback((v: string) => setFieldValue(SM.Example, v), [setFieldValue])
  const setSynonymsText = useCallback((v: string) => setFieldValue(SM.Synonyms, v), [setFieldValue])
  const setAntonyms = useCallback((v: string) => setFieldValue(SM.Antonyms, v), [setFieldValue])
  const setImageUrl = useCallback((v: string) => setFieldValue(SM.Image, v), [setFieldValue])
  const setAudioUrl = useCallback((v: string) => setFieldValue(SM.Audio, v), [setFieldValue])

  const setCardState = useCallback((patch: Partial<EditorCardState>) => {
    setFieldValues((prev) => {
      const next = { ...prev }
      if (patch.sentence !== undefined) next[SM.Expression] = patch.sentence
      if (patch.targetWord !== undefined) next[SM.Word] = patch.targetWord
      if (patch.translation !== undefined) next[SM.Translation] = patch.translation
      if (patch.notes !== undefined) next[SM.Notes] = patch.notes
      if (patch.transcription !== undefined) next[SM.Transcription] = patch.transcription
      if (patch.wordTypes !== undefined) next[SM.WordTypes] = patch.wordTypes
      if (patch.definition !== undefined) next[SM.Definition] = patch.definition
      if (patch.example !== undefined) next[SM.Example] = patch.example
      if (patch.synonymsText !== undefined) next[SM.Synonyms] = patch.synonymsText
      if (patch.antonyms !== undefined) next[SM.Antonyms] = patch.antonyms
      if (patch.imageUrl !== undefined) next[SM.Image] = patch.imageUrl
      if (patch.audioUrl !== undefined) next[SM.Audio] = patch.audioUrl
      return next
    })
    if (patch.imageId !== undefined) setImageId(patch.imageId)
  }, [])

  const resetEditorFields = useCallback(() => {
    setFieldValues({})
    setImageId("")
  }, [])

  const value = useMemo<EditorCardContextType>(
    () => ({
      fieldValues,
      setFieldValue,
      mergeFieldValues,
      activeCardTemplate,
      setActiveCardTemplate,
      sentence,
      targetWord,
      translation,
      notes,
      transcription,
      wordTypes,
      definition,
      example,
      synonymsText,
      antonyms,
      imageUrl,
      imageId,
      audioUrl,
      setSentence,
      setTargetWord,
      setTranslation,
      setNotes,
      setTranscription,
      setWordTypes,
      setDefinition,
      setExample,
      setSynonymsText,
      setAntonyms,
      setImageUrl,
      setImageId,
      setAudioUrl,
      setCardState,
      resetEditorFields,
    }),
    [
      fieldValues,
      setFieldValue,
      mergeFieldValues,
      activeCardTemplate,
      sentence,
      targetWord,
      translation,
      notes,
      transcription,
      wordTypes,
      definition,
      example,
      synonymsText,
      antonyms,
      imageUrl,
      imageId,
      audioUrl,
      setSentence,
      setTargetWord,
      setTranslation,
      setNotes,
      setTranscription,
      setWordTypes,
      setDefinition,
      setExample,
      setSynonymsText,
      setAntonyms,
      setImageUrl,
      setAudioUrl,
      setCardState,
      resetEditorFields,
    ]
  )

  return <EditorCardContext.Provider value={value}>{children}</EditorCardContext.Provider>
}

export function useEditorCard() {
  const ctx = useContext(EditorCardContext)
  if (ctx === undefined) {
    throw new Error("useEditorCard must be used within EditorCardProvider")
  }
  return ctx
}

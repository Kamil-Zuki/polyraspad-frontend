"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react"

export interface EditorCardState {
  sentence: string
  targetWord: string
  translation: string
  notes: string
  imageUrl: string
  imageId: string
  audioUrl: string
}

interface EditorCardContextType extends EditorCardState {
  setSentence: (v: string) => void
  setTargetWord: (v: string) => void
  setTranslation: (v: string) => void
  setNotes: (v: string) => void
  setImageUrl: (v: string) => void
  setImageId: (v: string) => void
  setAudioUrl: (v: string) => void
  setCardState: (patch: Partial<EditorCardState>) => void
}

const EditorCardContext = createContext<EditorCardContextType | undefined>(
  undefined,
)

export function EditorCardProvider({ children }: { children: ReactNode }) {
  const [sentence, setSentence] = useState("")
  const [targetWord, setTargetWord] = useState("")
  const [translation, setTranslation] = useState("")
  const [notes, setNotes] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageId, setImageId] = useState("")
  const [audioUrl, setAudioUrl] = useState("")

  const setCardState = useCallback((patch: Partial<EditorCardState>) => {
    if (patch.sentence !== undefined) setSentence(patch.sentence)
    if (patch.targetWord !== undefined) setTargetWord(patch.targetWord)
    if (patch.translation !== undefined) setTranslation(patch.translation)
    if (patch.notes !== undefined) setNotes(patch.notes)
    if (patch.imageUrl !== undefined) setImageUrl(patch.imageUrl)
    if (patch.imageId !== undefined) setImageId(patch.imageId)
    if (patch.audioUrl !== undefined) setAudioUrl(patch.audioUrl)
  }, [])

  return (
    <EditorCardContext.Provider
      value={{
        sentence,
        targetWord,
        translation,
        notes,
        imageUrl,
        imageId,
        audioUrl,
        setSentence,
        setTargetWord,
        setTranslation,
        setNotes,
        setImageUrl,
        setImageId,
        setAudioUrl,
        setCardState,
      }}
    >
      {children}
    </EditorCardContext.Provider>
  )
}

export function useEditorCard() {
  const ctx = useContext(EditorCardContext)
  if (ctx === undefined) {
    throw new Error("useEditorCard must be used within EditorCardProvider")
  }
  return ctx
}

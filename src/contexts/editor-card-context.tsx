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
  imageUrl: string
  audioUrl: string
}

interface EditorCardContextType extends EditorCardState {
  setSentence: (v: string) => void
  setTargetWord: (v: string) => void
  setTranslation: (v: string) => void
  setImageUrl: (v: string) => void
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
  const [imageUrl, setImageUrl] = useState("")
  const [audioUrl, setAudioUrl] = useState("")

  const setCardState = useCallback((patch: Partial<EditorCardState>) => {
    if (patch.sentence !== undefined) setSentence(patch.sentence)
    if (patch.targetWord !== undefined) setTargetWord(patch.targetWord)
    if (patch.translation !== undefined) setTranslation(patch.translation)
    if (patch.imageUrl !== undefined) setImageUrl(patch.imageUrl)
    if (patch.audioUrl !== undefined) setAudioUrl(patch.audioUrl)
  }, [])

  return (
    <EditorCardContext.Provider
      value={{
        sentence,
        targetWord,
        translation,
        imageUrl,
        audioUrl,
        setSentence,
        setTargetWord,
        setTranslation,
        setImageUrl,
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

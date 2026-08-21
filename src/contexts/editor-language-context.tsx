"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  loadStudyLanguagePair,
  normalizeStudyLanguageCode,
  saveStudyLanguagePair,
  validateDistinctStudyLanguages,
  type StudyLanguagePair,
} from "@/lib/languages/study-language-preferences"

export interface EditorLanguageContextType {
  studyLangPair: StudyLanguagePair
  setStudyLangPair: (next: StudyLanguagePair) => void
  sourceLang: string
  targetLang: string
  studyLangConflictMessage: string | null
}

const EditorLanguageContext = createContext<EditorLanguageContextType | undefined>(undefined)

export function EditorLanguageProvider({ children }: { children: ReactNode }) {
  const [studyLangPair, setStudyLangPairState] = useState<StudyLanguagePair>(() => loadStudyLanguagePair())

  useEffect(() => {
    saveStudyLanguagePair(studyLangPair)
  }, [studyLangPair])

  const setStudyLangPair = useCallback((next: StudyLanguagePair) => {
    setStudyLangPairState(next)
  }, [])

  const sourceLang = normalizeStudyLanguageCode(studyLangPair.sourceLanguage) || "en"
  const targetLang = normalizeStudyLanguageCode(studyLangPair.targetLanguage) || "ru"
  const studyLangConflictMessage = validateDistinctStudyLanguages(
    studyLangPair.sourceLanguage,
    studyLangPair.targetLanguage,
  )

  const value = useMemo<EditorLanguageContextType>(
    () => ({
      studyLangPair,
      setStudyLangPair,
      sourceLang,
      targetLang,
      studyLangConflictMessage,
    }),
    [studyLangPair, setStudyLangPair, sourceLang, targetLang, studyLangConflictMessage],
  )

  return <EditorLanguageContext.Provider value={value}>{children}</EditorLanguageContext.Provider>
}

export function useEditorLanguage() {
  const ctx = useContext(EditorLanguageContext)
  if (ctx === undefined) {
    throw new Error("useEditorLanguage must be used within EditorLanguageProvider")
  }
  return ctx
}

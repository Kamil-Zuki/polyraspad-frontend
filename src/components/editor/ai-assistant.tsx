"use client"

import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useEditorCard } from "@/contexts/editor-card-context"
import {
  ollamaGenerate,
  ollamaListModels,
  resolveEditorOllamaModel,
  EDITOR_DEFAULT_OLLAMA_MODEL,
} from "@/lib/api/ollama-client"

interface ContextExample {
  sentence: string
  translation: string
}

export function AiAssistant() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  /** Модель в UI; для Gemini приходит с сервера (GEMINI_MODEL) */
  const [ollamaModel, setOllamaModel] = useState<string>(EDITOR_DEFAULT_OLLAMA_MODEL)
  const [editorAiProvider, setEditorAiProvider] = useState<"ollama" | "gemini">("ollama")
  const {
    sentence,
    targetWord,
    translation,
    notes,
    setSentence,
    setTranslation,
    setNotes,
  } = useEditorCard()

  const [examples, setExamples] = useState<ContextExample[]>([])
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false)
  const [exampleError, setExampleError] = useState<string | null>(null)

  const [grammarText, setGrammarText] = useState<string | null>(null)
  const [isGeneratingGrammar, setIsGeneratingGrammar] = useState(false)
  const [grammarError, setGrammarError] = useState<string | null>(null)

  const [imageSuggestion, setImageSuggestion] = useState<string | null>(null)
  const [isSuggestingImage, setIsSuggestingImage] = useState(false)
  const [audioSuggestion, setAudioSuggestion] = useState<string | null>(null)
  const [isSuggestingAudio, setIsSuggestingAudio] = useState(false)

  const ollamaOptions = useCallback(
    () => ({
      model: ollamaModel,
      stream: false as const,
    }),
    [ollamaModel],
  )

  const fetchContextExample = useCallback(async () => {
    const word = targetWord.trim()
    if (!word) return

    setIsGeneratingExamples(true)
    setExampleError(null)
    try {
      const response = await ollamaGenerate({
        prompt: `Generate ONE example sentence in English that naturally uses the word "${word}" (the word must appear in the sentence). Then provide the Russian translation on the next line.

Format your response EXACTLY like this (nothing else):
SENTENCE: "[your English sentence here]"
TRANSLATION: "[your Russian translation here]"`,
        ...ollamaOptions(),
      })

      const sentenceMatch = response.match(/SENTENCE:\s*"([^"]+)"/i)
      const translationMatch = response.match(/TRANSLATION:\s*"([^"]+)"/i)

      const sentence = sentenceMatch?.[1]?.trim()
      const translation = translationMatch?.[1]?.trim()

      if (sentence && translation) {
        setExamples((prev) => [{ sentence, translation }, ...prev])
      } else {
        const lines = response.split("\n").filter(Boolean)
        const s = lines.find((l) => l.toLowerCase().startsWith("sentence:"))?.replace(/^sentence:\s*/i, "").trim()
        const t = lines.find((l) => l.toLowerCase().startsWith("translation:"))?.replace(/^translation:\s*/i, "").trim()
        if (s && t) {
          setExamples((prev) => [{ sentence: s, translation: t }, ...prev])
        } else {
          setExampleError("Could not parse example. Try again.")
        }
      }
    } catch (e) {
      setExampleError(e instanceof Error ? e.message : "Failed to generate")
    } finally {
      setIsGeneratingExamples(false)
    }
  }, [targetWord, ollamaOptions])

  const fetchGrammarExplanation = useCallback(async () => {
    const word = targetWord.trim()
    if (!word) return

    setIsGeneratingGrammar(true)
    setGrammarError(null)
    try {
      // SR-AI-02: гипер-контекст (предложение + целевое слово), ответ на русском, 2–3 предложения
      const ctxSentence = sentence.trim()
      const ctxTranslation = translation.trim()

      let prompt: string
      if (ctxSentence) {
        prompt = `You are a concise English grammar tutor. The learner's native language is Russian.

English sentence:
${ctxSentence}

Target word or phrase to explain:
${word}
${ctxTranslation ? `\nLearner's Russian back-of-card (optional context):\n${ctxTranslation}\n` : "\n"}

Write 2-3 short sentences in RUSSIAN only. Explain why the target appears in THIS sentence as it does (form, syntax, agreement, tense, word order, or a common mistake learners make here). Do not write a generic textbook article — tie every point to this sentence. No bullet lists, no English in the answer, no prefix like "Объяснение:".`
      } else {
        prompt = `You are a concise English grammar tutor. The learner's native language is Russian.
No full sentence was given.

English word or phrase:
${word}

Write 2-3 short sentences in RUSSIAN only: part of speech, typical usage or word-formation, common mistakes. No bullet lists, no English in the answer, no prefix like "Объяснение:".`
      }

      const response = await ollamaGenerate({
        prompt,
        ...ollamaOptions(),
      })

      const trimmed = response
        .trim()
        .replace(/^(объяснение|explanation)\s*[:：]\s*/i, "")
        .trim()
      if (trimmed) {
        setGrammarText(trimmed)
      } else {
        setGrammarError("Пустой ответ модели. Попробуйте ещё раз.")
      }
    } catch (e) {
      setGrammarError(e instanceof Error ? e.message : "Не удалось сгенерировать объяснение")
    } finally {
      setIsGeneratingGrammar(false)
    }
  }, [targetWord, sentence, translation, ollamaOptions])

  const fetchImageSuggestion = useCallback(async () => {
    const word = targetWord.trim()
    if (!word) return

    setIsSuggestingImage(true)
    try {
      const response = await ollamaGenerate({
        prompt: `Suggest a short, descriptive image search query (3-6 words) to find a visual representation for the English vocabulary word "${word}". Output ONLY the search query, nothing else.`,
        ...ollamaOptions(),
      })
      setImageSuggestion(response.trim() || `"${word}" vocabulary illustration`)
    } catch (e) {
      setImageSuggestion(`"${word}" vocabulary`)
    } finally {
      setIsSuggestingImage(false)
    }
  }, [targetWord, ollamaOptions])

  const fetchAudioSuggestion = useCallback(async () => {
    const word = targetWord.trim()
    if (!word) return

    setIsSuggestingAudio(true)
    try {
      const response = await ollamaGenerate({
        prompt: `For the English word "${word}", suggest a short phrase (5-10 words) that would be ideal for text-to-speech to help a language learner hear the word in context. Output ONLY the phrase, nothing else.`,
        ...ollamaOptions(),
      })
      setAudioSuggestion(response.trim() || `Example: "${word}" in a sentence`)
    } catch (e) {
      setAudioSuggestion(`"${word}" pronunciation`)
    } finally {
      setIsSuggestingAudio(false)
    }
  }, [targetWord, ollamaOptions])

  useEffect(() => {
    ollamaListModels()
      .then(({ models, provider }) => {
        setEditorAiProvider(provider)
        if (provider === "gemini" && models.length > 0) {
          setOllamaModel(models[0])
        } else {
          setOllamaModel(resolveEditorOllamaModel(models))
        }
      })
      .catch(() => {
        setEditorAiProvider("ollama")
        setOllamaModel(EDITOR_DEFAULT_OLLAMA_MODEL)
      })
  }, [])

  useEffect(() => {
    if (!targetWord.trim()) {
      setExamples([])
      setGrammarText(null)
      setImageSuggestion(null)
      setAudioSuggestion(null)
      setExampleError(null)
      setGrammarError(null)
    }
  }, [targetWord])

  return (
    <aside className={cn(
      "bg-app-surface border-l border-app-border flex flex-col shrink-0 z-10 transition-all duration-300",
      isCollapsed ? "w-12" : "w-96"
    )}>
      <div className="p-4 border-b border-app-border flex justify-between items-center overflow-hidden">
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-100 flex items-center gap-2 whitespace-nowrap">
              <i className="fas fa-robot text-brand-primary" /> AI Assistant
            </span>
            <span
              className="text-[10px] text-gray-500 truncate mt-0.5"
              title={`${editorAiProvider === "gemini" ? "Gemini" : "Ollama"}: ${ollamaModel}`}
            >
              {editorAiProvider === "gemini" ? "Gemini" : "Ollama"} · {ollamaModel}
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-600 hover:text-white transition w-full flex justify-center"
        >
          <i className={cn("fas", isCollapsed ? "fa-chevron-left" : "fa-chevron-right")} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll animate-in fade-in duration-300">
          {!targetWord.trim() ? (
            <p className="text-xs text-gray-500">Enter a target word to get AI suggestions.</p>
          ) : (
            <>
              {/* Context Generator (SR-AI-01) */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Context Generator</div>
                <div className="space-y-3">
                  {examples.map((ex, i) => (
                    <div
                      key={i}
                      className="glass-panel p-4 rounded-xl border border-app-border hover:border-brand-primary/50 cursor-pointer transition-all group"
                      onClick={() => {
                        setSentence(ex.sentence)
                        setTranslation(ex.translation)
                      }}
                    >
                      <p className="text-sm text-gray-100 mb-1.5 font-medium italic">&quot;{ex.sentence}&quot;</p>
                      <p className="text-xs text-gray-500">{ex.translation}</p>
                      <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 group-hover:text-brand-primary flex items-center gap-1.5 transition-colors">
                        <i className="fas fa-plus-circle" /> Use this example
                      </div>
                    </div>
                  ))}
                  {exampleError && (
                    <p className="text-xs text-red-400">{exampleError}</p>
                  )}
                  <button
                    onClick={fetchContextExample}
                    disabled={isGeneratingExamples}
                    className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-primary hover:border-brand-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingExamples ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fas fa-spinner fa-spin" /> Generating...
                      </span>
                    ) : (
                      "Generate more examples"
                    )}
                  </button>
                </div>
              </div>

              {/* Grammar Explainer (SR-AI-02: контекст предложения + объяснение на русском) */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Grammar Explainer</div>
                <div className="glass-panel p-4 rounded-xl border border-app-border text-sm leading-relaxed">
                  {!sentence.trim() && (
                    <p className="text-[10px] text-amber-500/90 mb-3 leading-snug">
                      Для точного объяснения (как в спецификации SR-AI-02) лучше заполнить поле Sentence — тогда модель привяжет грамматику к контексту.
                    </p>
                  )}
                  {grammarText ? (
                    <>
                      <p className="text-gray-400 mb-3 whitespace-pre-wrap">{grammarText}</p>
                      <button
                        onClick={() => setNotes(notes ? `${notes}\n\n${grammarText}` : grammarText)}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <i className="fas fa-plus" /> Add to notes
                      </button>
                    </>
                  ) : grammarError ? (
                    <div className="space-y-2">
                      <p className="text-red-400 text-xs">{grammarError}</p>
                      <button
                        type="button"
                        onClick={fetchGrammarExplanation}
                        disabled={isGeneratingGrammar || !targetWord.trim()}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-white transition-colors disabled:opacity-50"
                      >
                        Повторить
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={fetchGrammarExplanation}
                      disabled={isGeneratingGrammar || !targetWord.trim()}
                      className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingGrammar ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-lightbulb" />}
                      {" "}{isGeneratingGrammar ? "Генерация…" : "Explain grammar"}
                    </button>
                  )}
                </div>
              </div>

              {/* Media Suggestions */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Media Suggestions</div>
                <div className="grid grid-cols-1 gap-3">
                  <div
                    className="bg-app-bg border border-dashed border-white/10 rounded-xl min-h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group p-4"
                    onClick={fetchImageSuggestion}
                  >
                    {isSuggestingImage ? (
                      <span className="text-xs text-gray-400 flex items-center gap-2">
                        <i className="fas fa-spinner fa-spin" /> Suggesting...
                      </span>
                    ) : imageSuggestion ? (
                      <span className="text-xs text-gray-300 text-center" title={imageSuggestion}>
                        Search: {imageSuggestion}
                      </span>
                    ) : (
                      <>
                        <i className="fas fa-image text-lg text-gray-600 group-hover:text-brand-primary transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Suggest Image</span>
                      </>
                    )}
                  </div>
                  <div
                    className="bg-app-bg border border-dashed border-white/10 rounded-xl min-h-24 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-secondary/50 hover:bg-brand-secondary/5 transition-all group p-4"
                    onClick={fetchAudioSuggestion}
                  >
                    {isSuggestingAudio ? (
                      <span className="text-xs text-gray-400 flex items-center gap-2">
                        <i className="fas fa-spinner fa-spin" /> Suggesting...
                      </span>
                    ) : audioSuggestion ? (
                      <span className="text-xs text-gray-300 text-center" title={audioSuggestion}>
                        TTS phrase: {audioSuggestion}
                      </span>
                    ) : (
                      <>
                        <i className="fas fa-volume-up text-lg text-gray-600 group-hover:text-brand-secondary transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Suggest Audio</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  )
}

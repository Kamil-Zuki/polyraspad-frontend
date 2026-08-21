"use client"

import { useState } from "react"
import type React from "react"
import { cn } from "@/lib/utils"
import type { NoteFieldDefinitionDto } from "@/lib/api/types"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { useEditorAiActions } from "@/lib/editor/use-editor-ai-actions"
import { appendNotesValue } from "@/lib/editor/polyguide-card-patches"
import { PaywallGate } from "@/components/billing/paywall-gate"

type EditorMiningFieldsProps = {
  fields: NoteFieldDefinitionDto[]
  fieldValues: Record<string, string>
  setFieldValue: (key: string, v: string) => void
  sentence: string
  setSentence: (v: string) => void
  targetWord: string
  setTargetWord: (v: string) => void
  translation: string
  setTranslation: (v: string) => void
  transcription: string
  setTranscription: (v: string) => void
  wordTypes: string
  setWordTypes: (v: string) => void
  definition: string
  setDefinition: (v: string) => void
  example: string
  setExample: (v: string) => void
  synonymsText: string
  setSynonymsText: (v: string) => void
  antonyms: string
  setAntonyms: (v: string) => void
  notes: string
  setNotes: (v: string) => void
  sentenceTextareaRef: React.RefObject<HTMLTextAreaElement | null>
  useSelectedWordFromExpression: () => void
  ExpressionWordPicker: React.ComponentType<{
    expression: string
    selectedWord: string
    isLoading: boolean
    onPickWord: (raw: string) => void
  }>
  isLookingUpDictionary: boolean
  handleDictionaryLookup: (wordOverride?: string) => Promise<void>
  isTranslating?: boolean
  handleTranslate?: () => Promise<void>
  showAdvanced?: boolean
  aiError?: string | null
  onClearAiError?: () => void
  isAutoFilling?: boolean
  onAutoFill?: () => void
}

const SM = SENTENCE_MINING

const CORE_FIELDS: Set<string> = new Set([SM.Expression, SM.Word, SM.Translation])

export function EditorMiningFields(props: EditorMiningFieldsProps) {
  const {
    fields,
    sentence,
    setSentence,
    targetWord,
    setTargetWord,
    translation,
    setTranslation,
    transcription,
    setTranscription,
    wordTypes,
    setWordTypes,
    definition,
    setDefinition,
    example,
    setExample,
    synonymsText,
    setSynonymsText,
    antonyms,
    setAntonyms,
    notes,
    setNotes,
    sentenceTextareaRef,
    useSelectedWordFromExpression,
    ExpressionWordPicker,
    isLookingUpDictionary,
    handleDictionaryLookup,
    isTranslating,
    handleTranslate,
    showAdvanced = false,
    aiError,
    onClearAiError,
    isAutoFilling,
    onAutoFill,
  } = props

  const aiActions = useEditorAiActions()

  const [expanded, setExpanded] = useState(showAdvanced)

  const coreFields = fields.filter((f) => CORE_FIELDS.has(f.fieldKey))
  const advancedFields = fields.filter((f) => !CORE_FIELDS.has(f.fieldKey))
  const filledAdvancedCount = advancedFields.filter((f) => (props.fieldValues[f.fieldKey] ?? "").trim()).length

  const renderField = (field: NoteFieldDefinitionDto) => {
        const key = field.fieldKey

        if (key === SM.Expression) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border relative">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                {field.label}
                {field.required ? <span className="text-red-400"> *</span> : null}
              </label>
              <div className="relative group">
                <textarea
                  ref={sentenceTextareaRef}
                  data-testid="sentence-input"
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  onSelect={() => {
                    const ta = sentenceTextareaRef.current
                    if (!ta) return
                    const start = ta.selectionStart
                    const end = ta.selectionEnd
                    if (start === end) return
                    const selected = sentence.slice(start, end).trim()
                    if (selected) {
                      const raw = selected.replace(/^[^\p{L}\p{N}'-]+|[^\p{L}\p{N}'-]+$/gu, "").trim()
                      if (raw) setTargetWord(raw)
                    }
                  }}
                  className="input-dark w-full p-5 rounded-2xl text-2xl min-h-[140px] resize-none leading-relaxed"
                  placeholder="Type or paste your sentence here..."
                  required={field.required}
                />
                <div className="absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest text-gray-600 group-focus-within:text-brand-primary transition-colors">
                  Highlight or double-click a word to set Target
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <PaywallGate gate="canUseGrammarTutor" mode="hidden" className="inline-block rounded-full">
                    <button
                      type="button"
                      onClick={() => void aiActions.explainGrammar()}
                      disabled={aiActions.isAiBusy || !targetWord.trim()}
                      title={targetWord.trim() ? "Explain grammar for this word" : "Highlight a word first"}
                      className="text-brand-primary hover:text-white disabled:opacity-40 transition p-1"
                      aria-label="Explain grammar"
                    >
                      <i className={cn("fas", aiActions.isAiBusy ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles")} />
                    </button>
                  </PaywallGate>
                </div>
              </div>
              {onAutoFill && (
                <PaywallGate gate="canUseAutoMine" mode="hidden">
                  <button
                    type="button"
                    onClick={() => void onAutoFill()}
                    disabled={isAutoFilling || !sentence.trim() || !targetWord.trim()}
                    className={cn(
                      "mt-4 w-full rounded-xl border px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2",
                      isAutoFilling || !sentence.trim() || !targetWord.trim()
                        ? "border-white/10 bg-white/5 text-gray-500 cursor-not-allowed"
                        : "border-white/20 bg-white/5 hover:bg-white/10 text-white active:scale-95"
                    )}
                  >
                    {isAutoFilling ? (
                      <>
                        <i className="fas fa-spinner fa-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Auto-Fill
                      </>
                    )}
                  </button>
                </PaywallGate>
              )}

              <ExpressionWordPicker
                expression={sentence}
                selectedWord={targetWord}
                isLoading={isLookingUpDictionary}
                onPickWord={(raw) => {
                  const w = raw.replace(/^[^\p{L}\p{N}'-]+|[^\p{L}\p{N}'-]+$/gu, "").trim()
                  if (!w) return
                  setTargetWord(w)
                }}
              />
              <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                Example: &quot;He decided to{" "}
                <strong className="text-brand-primary font-bold">address</strong> the issue.&quot;
              </p>
            </section>
          )
        }

        if (key === SM.Word) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border relative">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                {field.label}
                {field.required ? <span className="text-red-400"> *</span> : null}
              </label>
              <input
                type="text"
                data-testid="target-input"
                value={targetWord}
                onChange={(e) => setTargetWord(e.target.value)}
                className="input-dark w-full p-4 rounded-xl font-bold text-white pr-10"
                placeholder="Target word or phrase"
                required={field.required}
              />
              <button
                type="button"
                onClick={() => {
                  onClearAiError?.()
                  void aiActions.defineWithAi().then((patch) => {
                    if (patch) {
                      props.setDefinition(patch[SENTENCE_MINING.Definition] ?? props.definition)
                      if (patch[SENTENCE_MINING.WordTypes]) props.setWordTypes(patch[SENTENCE_MINING.WordTypes])
                      if (patch[SENTENCE_MINING.Transcription]) props.setTranscription(patch[SENTENCE_MINING.Transcription])
                      props.setNotes(patch[SENTENCE_MINING.Notes] ?? props.notes)
                    }
                  })
                }}
                disabled={aiActions.isAiBusy || !targetWord.trim()}
                title={targetWord.trim() ? "Define with AI" : "Enter a word first"}
                className="absolute right-4 top-[46px] text-brand-primary hover:text-white disabled:opacity-40 transition"
                aria-label="Define with AI"
              >
                <i className={cn("fas", aiActions.isAiBusy ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles")} />
              </button>
              <div className="flex flex-wrap gap-3 mt-3">
                <button
                  type="button"
                  onClick={useSelectedWordFromExpression}
                  className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary hover:text-white transition-colors"
                >
                  Use selected text
                </button>
                <button
                  type="button"
                  onClick={() => void handleDictionaryLookup()}
                  disabled={isLookingUpDictionary || !targetWord.trim()}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-40",
                    isLookingUpDictionary ? "text-gray-500" : "text-brand-primary hover:text-white"
                  )}
                >
                  <i className={cn("fas", isLookingUpDictionary ? "fa-spinner fa-spin" : "fa-book")} />
                  {isLookingUpDictionary ? "Looking up..." : "Define word"}
                </button>
              </div>
            </section>
          )
        }

        if (key === SM.Translation) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                {field.label}
                {field.required ? <span className="text-red-400"> *</span> : null}
              </label>
              <p className="text-[10px] text-gray-500 mb-3">
                {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" 
                  ? "AI translate is available from the sparkle icon, or use Auto-fill for the whole card." 
                  : "Use Auto-fill for the whole card."}
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className="input-dark w-full p-4 rounded-xl text-white pr-10"
                  placeholder="Translation in context"
                  required={field.required}
                />
                <button
                  type="button"
                  onClick={() => {
                    onClearAiError?.()
                    void aiActions.aiTranslate().then((patch) => {
                      if (patch?.[SENTENCE_MINING.Translation]) {
                        setTranslation(patch[SENTENCE_MINING.Translation])
                      }
                    })
                  }}
                  disabled={aiActions.isAiBusy || !sentence.trim()}
                  title={sentence.trim() ? "Translate with AI" : "Enter an expression first"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary hover:text-white disabled:opacity-40 transition"
                  aria-label="Translate with AI"
                >
                  <i className={cn("fas", aiActions.isAiBusy ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles")} />
                </button>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => void handleTranslate?.()}
                  disabled={isTranslating || !sentence.trim()}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-40",
                    isTranslating ? "text-gray-500" : "text-brand-primary hover:text-white"
                  )}
                >
                  <i className={cn("fas", isTranslating ? "fa-spinner fa-spin" : "fa-language")} />
                  {isTranslating ? "Translating..." : "Translate in context"}
                </button>
              </div>
            </section>
          )
        }

        if (key === SM.Transcription) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                {field.label}
              </label>
              <input
                type="text"
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="input-dark w-full p-4 rounded-xl text-white"
                placeholder="IPA / phonetic"
              />
            </section>
          )
        }

        if (key === SM.WordTypes) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                {field.label}
              </label>
              <input
                type="text"
                value={wordTypes}
                onChange={(e) => setWordTypes(e.target.value)}
                className="input-dark w-full p-4 rounded-xl text-white"
                placeholder="noun, phrasal verb…"
              />
            </section>
          )
        }

        if (key === SM.Definition) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                {field.label}
              </label>
              <textarea
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                className="input-dark w-full p-4 rounded-xl text-sm min-h-[100px] resize-y"
                placeholder="Dictionary-style definition"
              />
            </section>
          )
        }

        if (key === SM.Example) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border relative">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {field.label}
                </label>
                {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearAiError?.()
                      void aiActions.generateExample().then((patch) => {
                        if (patch?.[SENTENCE_MINING.Example]) {
                          setExample(patch[SENTENCE_MINING.Example])
                        }
                      })
                    }}
                    disabled={aiActions.isAiBusy || !targetWord.trim()}
                    title={targetWord.trim() ? "Generate example with AI" : "Enter a target word first"}
                    className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-white disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <i className={cn("fas", aiActions.isAiBusy ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles")} />
                    Generate example
                  </button>
                )}
              </div>
              <textarea
                value={example}
                onChange={(e) => setExample(e.target.value)}
                className="input-dark w-full p-4 rounded-xl text-sm min-h-[120px] resize-y"
                placeholder="Extra context, neighboring lines…"
              />
            </section>
          )
        }

        if (key === SM.Synonyms) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                {field.label}
              </label>
              <input
                type="text"
                value={synonymsText}
                onChange={(e) => setSynonymsText(e.target.value)}
                className="input-dark w-full p-4 rounded-xl text-white"
                placeholder="Comma-separated"
              />
            </section>
          )
        }

        if (key === SM.Antonyms) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                {field.label}
              </label>
              <input
                type="text"
                value={antonyms}
                onChange={(e) => setAntonyms(e.target.value)}
                className="input-dark w-full p-4 rounded-xl text-white"
                placeholder="Comma-separated"
              />
            </section>
          )
        }

        if (key === SM.Notes) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border relative">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {field.label}
                </label>
                {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearAiError?.()
                      void aiActions.explainWord().then((text) => {
                        if (text) {
                          props.setNotes(appendNotesValue(props.notes, text))
                        }
                      })
                    }}
                    disabled={aiActions.isAiBusy || !targetWord.trim()}
                    title={targetWord.trim() ? "Explain word with AI" : "Enter a target word first"}
                    className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-white disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <i className={cn("fas", aiActions.isAiBusy ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles")} />
                    Explain word
                  </button>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-dark w-full p-4 rounded-xl text-sm min-h-[80px] resize-none"
                placeholder="Free-form notes (also appended by dictionary lookup)"
              />
            </section>
          )
        }

        const val = props.fieldValues[field.fieldKey] ?? ""
        const setVal = (v: string) => props.setFieldValue(field.fieldKey, v)
        const isTextarea = field.fieldType === "textarea" || field.fieldType === "tags"

        if (isTextarea) {
          return (
            <section key={key} className="glass-panel p-6 rounded-2xl border-app-border">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                {field.label}
                {field.required ? <span className="text-red-400"> *</span> : null}
              </label>
              <textarea
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="input-dark w-full p-4 rounded-xl text-sm min-h-[80px] resize-y"
                placeholder={field.label}
                required={field.required}
              />
            </section>
          )
        }

        return (
          <section key={key} className="glass-panel p-6 rounded-2xl border-app-border">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              {field.label}
              {field.required ? <span className="text-red-400"> *</span> : null}
            </label>
            <input
              type={field.fieldType === "url" ? "url" : "text"}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="input-dark w-full p-4 rounded-xl text-white"
              placeholder={field.label}
              required={field.required}
            />
          </section>
        )
  }

  const expressionField = coreFields.find((f) => f.fieldKey === SM.Expression)
  const wordField = coreFields.find((f) => f.fieldKey === SM.Word)
  const translationField = coreFields.find((f) => f.fieldKey === SM.Translation)

  return (
    <div className="space-y-5">
      {expressionField && renderField(expressionField)}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {wordField && renderField(wordField)}
        {translationField && renderField(translationField)}
      </div>

      {advancedFields.length > 0 && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/5"
          >
            <span className="flex items-center gap-2">
              <i className={cn("fas", expanded ? "fa-chevron-up" : "fa-chevron-down")} />
              {expanded
                ? "Hide advanced fields"
                : `Show advanced fields (${filledAdvancedCount}/${advancedFields.length} filled)`}
            </span>
          </button>

          {expanded && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-5">
              {advancedFields.map(renderField)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

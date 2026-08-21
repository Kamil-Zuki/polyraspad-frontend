"use client"

import {
  STUDY_LANGUAGE_PRESETS,
  normalizeStudyLanguageCode,
  presetLabelForCode,
  type StudyLanguagePair,
} from "@/lib/languages/study-language-preferences"
import { cn } from "@/lib/utils"

interface StudyLanguageSelectorsProps {
  pair: StudyLanguagePair
  onChange: (next: StudyLanguagePair) => void
  /** Prefix for ids / aria labels */
  idPrefix: string
  compact?: boolean
  /** Highlight when source === target */
  showSameLangWarning?: boolean
  className?: string
}

/**
 * Compact source/target selectors with presets + optional custom ISO-style code per side.
 */
export function StudyLanguageSelectors({
  pair,
  onChange,
  idPrefix,
  compact,
  showSameLangWarning,
  className,
}: StudyLanguageSelectorsProps) {
  const sourceId = `${idPrefix}-source-lang`
  const targetId = `${idPrefix}-target-lang`
  const sourceCustomId = `${idPrefix}-source-custom`
  const targetCustomId = `${idPrefix}-target-custom`

  const sourceNorm = normalizeStudyLanguageCode(pair.sourceLanguage)
  const targetNorm = normalizeStudyLanguageCode(pair.targetLanguage)
  const sourceIsPreset = Boolean(sourceNorm) && STUDY_LANGUAGE_PRESETS.some((p) => p.code === sourceNorm)
  const targetIsPreset = Boolean(targetNorm) && STUDY_LANGUAGE_PRESETS.some((p) => p.code === targetNorm)

  const directionHint = `Translate: ${presetLabelForCode(sourceNorm)} → ${presetLabelForCode(targetNorm)}`

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className={cn("text-[11px] text-gray-400", compact ? "leading-snug" : "")} aria-live="polite">
        {directionHint}
      </p>
      <div className={cn("flex flex-wrap items-end gap-3", compact && "gap-2")}>
        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          <span>Source</span>
          <select
            id={sourceId}
            aria-label="Study source language"
            value={sourceIsPreset ? sourceNorm : "__custom__"}
            onChange={(e) => {
              const v = e.target.value
              if (v === "__custom__") {
                onChange({ ...pair, sourceLanguage: "" })
                return
              }
              onChange({ ...pair, sourceLanguage: v })
            }}
            className="rounded-lg border border-white/15 bg-[#0c1017] px-2 py-1.5 text-xs text-white"
          >
            {STUDY_LANGUAGE_PRESETS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label} ({p.code})
              </option>
            ))}
            <option value="__custom__">Custom code…</option>
          </select>
        </label>

        {!sourceIsPreset ? (
          <label htmlFor={sourceCustomId} className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            <span>Custom</span>
            <input
              id={sourceCustomId}
              aria-label="Custom study source language code"
              value={pair.sourceLanguage}
              maxLength={16}
              placeholder="e.g. pl"
              onChange={(e) => onChange({ ...pair, sourceLanguage: e.target.value })}
              className="w-[88px] rounded-lg border border-white/15 bg-[#0c1017] px-2 py-1.5 text-xs text-white placeholder:text-gray-600"
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          <span>Target</span>
          <select
            id={targetId}
            aria-label="Study target language"
            value={targetIsPreset ? targetNorm : "__custom__"}
            onChange={(e) => {
              const v = e.target.value
              if (v === "__custom__") {
                onChange({ ...pair, targetLanguage: "" })
                return
              }
              onChange({ ...pair, targetLanguage: v })
            }}
            className="rounded-lg border border-white/15 bg-[#0c1017] px-2 py-1.5 text-xs text-white"
          >
            {STUDY_LANGUAGE_PRESETS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label} ({p.code})
              </option>
            ))}
            <option value="__custom__">Custom code…</option>
          </select>
        </label>

        {!targetIsPreset ? (
          <label htmlFor={targetCustomId} className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            <span>Custom</span>
            <input
              id={targetCustomId}
              aria-label="Custom study target language code"
              value={pair.targetLanguage}
              maxLength={16}
              placeholder="e.g. uk"
              onChange={(e) => onChange({ ...pair, targetLanguage: e.target.value })}
              className="w-[88px] rounded-lg border border-white/15 bg-[#0c1017] px-2 py-1.5 text-xs text-white placeholder:text-gray-600"
            />
          </label>
        ) : null}
      </div>
      {showSameLangWarning ? (
        <p className="text-[11px] text-amber-300" role="alert">
          Source and target languages are identical — translation is disabled until you pick two different languages.
        </p>
      ) : null}
    </div>
  )
}

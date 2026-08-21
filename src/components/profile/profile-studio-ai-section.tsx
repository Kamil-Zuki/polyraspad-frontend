"use client"

import { useEffect, useState } from "react"
import type { CopilotLanguageCode } from "@/lib/api/types"
import {
  ollamaListModels,
  resolveEditorOllamaModel,
  EDITOR_DEFAULT_AI_MODEL,
  type EditorAiBackend,
} from "@/lib/api/ollama-client"
import {
  defaultAiModelPreference,
  loadAiModelPreference,
  saveAiModelPreference,
  type AiModelPreference,
} from "@/lib/studio/ai-model-preferences"

const LANG_TABS: { id: "default" | CopilotLanguageCode; label: string; hint?: string }[] = [
  { id: "default", label: "Default", hint: "Fallback when no per-language override" },
  { id: "en", label: "English study" },
  { id: "ru", label: "Russian study" },
  { id: "ko", label: "Korean study" },
]

export function ProfileStudioAiSection() {
  const [models, setModels] = useState<string[]>([])
  const [provider, setProvider] = useState<EditorAiBackend>("openai-compatible")
  const [pref, setPref] = useState<AiModelPreference>(defaultAiModelPreference)
  const [activeTab, setActiveTab] = useState<(typeof LANG_TABS)[number]["id"]>("default")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isLoadingList, setIsLoadingList] = useState(true)

  useEffect(() => {
    setPref(loadAiModelPreference())

    let cancelled = false
    ;(async () => {
      setIsLoadingList(true)
      setLoadError(null)
      try {
        const res = await ollamaListModels()
        if (cancelled) return
        setModels(res.models ?? [])
        setProvider(res.provider)
        const saved = loadAiModelPreference()
        const resolved = resolveEditorOllamaModel(res.models ?? [], saved.modelId)
        setPref((prev) => ({ ...prev, modelId: resolved }))
      } catch (e) {
        if (cancelled) return
        setLoadError(e instanceof Error ? e.message : "Could not load models.")
        setModels([])
      } finally {
        if (!cancelled) setIsLoadingList(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const resolvedDefaultModel = resolveEditorOllamaModel(models, pref.modelId)

  const displayValueForTab = () => {
    if (activeTab === "default") return resolvedDefaultModel
    const override = pref.profiles?.[activeTab]?.trim()
    return override ? resolveEditorOllamaModel(models, override) : resolvedDefaultModel
  }

  const setModelForActiveTab = (nextId: string) => {
    const trimmed = nextId.trim()
    if (activeTab === "default") {
      setPref((p) => ({ ...p, modelId: trimmed || EDITOR_DEFAULT_AI_MODEL }))
      return
    }
    setPref((p) => ({
      ...p,
      profiles: {
        ...p.profiles,
        [activeTab]: trimmed,
      },
    }))
  }

  const handleSave = () => {
    saveAiModelPreference(pref)
    setFeedback("Saved. PolyGuide and editor features use these models on reload.")
    setTimeout(() => setFeedback(null), 3200)
  }

  const providerLabel = provider === "gemini" ? "Gemini (Next server)" : "LLM via Aggregator"

  return (
    <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8 h-fit">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">AI models (PolyGuide)</h2>
          <p className="text-sm text-gray-500">
            Choose a default model and optional overrides when the study language is English, Russian, or Korean. Stored in
            the browser.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Backend</p>
          <p className="mt-1 text-sm font-medium text-white">{providerLabel}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loadError && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95 space-y-2">
            <p className="font-medium text-amber-50">{loadError}</p>
            <p className="text-xs text-amber-200/85 leading-relaxed">
              <strong className="font-medium text-amber-100">Two server-side pieces:</strong>{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-[11px]">AI_PROXY_API_KEY</code> on the{" "}
              <strong>Next</strong> app (BFF → Aggregator header) must match{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-[11px]">Ai__ProxyApiKey</code> on{" "}
              <strong>Aggregator</strong>.
            </p>
          </div>
        )}
        {isLoadingList && <p className="text-sm text-gray-500">Loading models…</p>}

        {!isLoadingList && (
          <>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-1">
              {LANG_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[88px] rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    activeTab === tab.id
                      ? "bg-brand-purple/35 text-white border border-brand-purple/50"
                      : "text-gray-400 hover:text-white border border-transparent"
                  }`}
                  title={tab.hint}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500">
              {LANG_TABS.find((t) => t.id === activeTab)?.hint ?? "Override clears when empty (uses default)."}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {activeTab === "default" ? "Preferred model (default fallback)" : `Model override (${activeTab})`}
              </label>
              {models.length > 0 ? (
                <select
                  value={displayValueForTab()}
                  onChange={(e) => setModelForActiveTab(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                  aria-label="Preferred LLM model"
                >
                  {models.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={displayValueForTab()}
                    onChange={(e) => setModelForActiveTab(e.target.value)}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                    placeholder={EDITOR_DEFAULT_AI_MODEL}
                    aria-label="Preferred LLM model id"
                  />
                  <p className="text-xs text-gray-500">
                    No list from server—enter a model id that Aggregator is allowed to use.
                  </p>
                </div>
              )}
              {activeTab !== "default" && (
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-amber-200/90 hover:text-amber-50"
                  onClick={() =>
                    setPref((p) => {
                      const rest = { ...(p.profiles ?? {}) }
                      delete rest[activeTab]
                      return { ...p, profiles: Object.keys(rest).length ? rest : undefined }
                    })
                  }
                >
                  Clear {activeTab} override (use default)
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Save model preference
            </button>
            {feedback && <p className="text-sm text-emerald-400">{feedback}</p>}
          </>
        )}
      </div>
    </section>
  )
}

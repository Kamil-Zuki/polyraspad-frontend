"use client"

import { useState, useCallback, useMemo } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useProjectContext } from "@/contexts/project-context"
import { useDeckTree } from "@/lib/react-query/deck-queries"
import { getLeafDecksFromTree } from "@/lib/utils/deck-tree-utils"
import { apiClient } from "@/lib/api"
import type {
  TextTokenDto,
  TextAnalyzeResponseDto,
  TextTokenStatus,
  CaptureCardDto,
} from "@/lib/api/types"
import {
  getTokenStatusClass,
  clientSideTokenize,
  extractSentenceFromTokens,
} from "./reader-utils"

export default function ReaderPage() {
  const { currentProject } = useProjectContext()
  const queryClient = useQueryClient()
  const [rawText, setRawText] = useState("")
  const [result, setResult] = useState<TextAnalyzeResponseDto | null>(null)
  const [sourceTitle, setSourceTitle] = useState("")
  /** Колода для майнинга: пусто = Inbox (SR-API-01). */
  const [miningDeckId, setMiningDeckId] = useState("")
  /** URL источника для метаданных (SR-VOC-03). */
  const [sourceUrl, setSourceUrl] = useState("")
  const [minedWord, setMinedWord] = useState<{
    word: string
    lemma: string | undefined
    sentence: string
    tokenIndex: number
  } | null>(null)
  const [translation, setTranslation] = useState("")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const projectId = currentProject?.id ?? ""
  const { data: deckTree } = useDeckTree(projectId, "mine")
  const leafDecks = useMemo(
    () => (deckTree && deckTree.length > 0 ? getLeafDecksFromTree(deckTree) : []),
    [deckTree]
  )
  const selectedDeckTitle = useMemo(
    () => leafDecks.find((d) => d.id === miningDeckId)?.title ?? null,
    [leafDecks, miningDeckId]
  )

  const analyzeMutation = useMutation({
    mutationFn: async (text: string) => {
      try {
        return await apiClient.text.analyze({
          projectId: currentProject!.id,
          text,
        })
      } catch (err) {
        const isNotFound =
          err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404
        if (isNotFound) {
          return clientSideTokenize(text)
        }
        throw err
      }
    },
    onSuccess: (data) => setResult(data),
  })

  const captureMutation = useMutation({
    mutationFn: (data: CaptureCardDto) => apiClient.cards.captureCard(data),
    onSuccess: (_, variables) => {
      const deckLabel = variables.deckId
        ? selectedDeckTitle ?? "selected deck"
        : "Inbox"
      setSuccessMessage(`Card saved to ${deckLabel}`)
      setTimeout(() => setSuccessMessage(null), 3000)
      queryClient.invalidateQueries({ queryKey: ["decks", "tree"] })
      queryClient.invalidateQueries({ queryKey: ["cards"] })
      setMinedWord(null)
      setTranslation("")
      if (result && minedWord) {
        const tokenStatus = result.tokens[minedWord.tokenIndex]
        if (tokenStatus && "status" in tokenStatus) {
          const updated = { ...result }
          updated.tokens = [...result.tokens]
          updated.tokens[minedWord.tokenIndex] = {
            ...tokenStatus,
            status: "LEARNING" as TextTokenStatus,
          }
          setResult(updated)
        }
      }
    },
  })

  const handleAnalyze = useCallback(() => {
    if (!currentProject || !rawText.trim()) return
    analyzeMutation.mutate(rawText.trim())
  }, [currentProject, rawText, analyzeMutation])

  const handleTokenClick = useCallback(
    (token: TextTokenDto, index: number) => {
      if (token.type !== "WORD" || !result) return
      const status = token.status ?? "NONE"
      if (status !== "NEW" && status !== "LEARNING") return
      const sentence = extractSentenceFromTokens(result.tokens, index)
      setMinedWord({
        word: token.text,
        lemma: token.lemma ?? undefined,
        sentence,
        tokenIndex: index,
      })
      setTranslation("")
    },
    [result]
  )

  const handleMine = useCallback(() => {
    if (!currentProject || !minedWord) return
    if (!translation.trim()) return
    const payload: CaptureCardDto = {
      projectId: currentProject.id,
      sentence: minedWord.sentence,
      targetWord: minedWord.word,
      translation: translation.trim(),
      sourceMeta: {
        type: "TEXT",
        title: sourceTitle || "Reader",
        ...(sourceUrl.trim() ? { url: sourceUrl.trim() } : {}),
      },
    }
    if (miningDeckId.trim()) payload.deckId = miningDeckId.trim()
    captureMutation.mutate(payload)
  }, [currentProject, minedWord, translation, sourceTitle, sourceUrl, miningDeckId, captureMutation])

  const noProject = !currentProject

  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-y-auto p-8 relative custom-scroll">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Reader</h1>
            <p className="text-gray-400">
              Read texts, see word status (New / Learning / Known), and mine cards in one click
            </p>
          </div>

          {noProject ? (
            <div className="glass-panel rounded-xl p-8 text-center">
              <div className="mb-4">
                <i className="fas fa-book-reader text-6xl text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Select a project</h2>
              <p className="text-gray-400">
                Choose a project in the sidebar to analyze text and mine vocabulary.
              </p>
            </div>
          ) : (
            <>
              <div className="glass-panel rounded-xl p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Mining deck (optional)
                    </label>
                    <select
                      value={miningDeckId}
                      onChange={(e) => setMiningDeckId(e.target.value)}
                      className="w-full bg-app-bg border border-white/5 rounded-lg px-4 py-2 text-white focus:border-brand-primary focus:outline-none"
                      aria-label="Choose deck for mined cards"
                    >
                      <option value="">Inbox (default)</option>
                      {leafDecks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                    {projectId && leafDecks.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">No decks. Create one in Library.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Source title (optional)
                    </label>
                    <input
                      type="text"
                      value={sourceTitle}
                      onChange={(e) => setSourceTitle(e.target.value)}
                      placeholder="e.g. Article: Mythical Creatures"
                      className="w-full bg-app-bg border border-white/5 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none"
                    />
                  </div>
                </div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Source URL (optional, SR-VOC-03)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-app-bg border border-white/5 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none mb-4"
                />
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Paste or type text to analyze
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="The cat jumped over a fence. The huge behemoth rose from the water."
                  rows={6}
                  className="w-full bg-app-bg border border-white/5 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none resize-y font-reader"
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">
                    Words will be highlighted: <span className="text-cyan-400">New</span>,{" "}
                    <span className="text-amber-400">Learning</span>,{" "}
                    <span className="text-gray-400">Known</span>. Click a word to mine a card.
                  </p>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={!rawText.trim() || analyzeMutation.isPending}
                    className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:brightness-110 transition shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzeMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <i className="fas fa-spinner fa-spin" /> Analyze
                      </span>
                    ) : (
                      "Analyze"
                    )}
                  </button>
                </div>
                {analyzeMutation.isError && (
                  <p className="mt-3 text-sm text-rose-400">
                    {analyzeMutation.error instanceof Error
                      ? analyzeMutation.error.message
                      : "Analysis failed. The /text/analyze API may not be available yet."}
                  </p>
                )}
              </div>

              {result && result.tokens.length > 0 && (
                <div className="glass-panel rounded-xl p-6 relative">
                  {result.stats != null && (
                    <div className="flex gap-4 mb-4 text-sm">
                      <span className="text-gray-400">
                        Unique words: <strong className="text-white">{result.stats.uniqueWords}</strong>
                      </span>
                      <span className="text-gray-400">
                        Known: <strong className="text-emerald-400">{result.stats.knownPercentage}%</strong>
                      </span>
                    </div>
                  )}
                  <div className="text-lg leading-relaxed font-reader select-text">
                    {result.tokens.map((token, i) => {
                      if (token.type === "SPACE" || token.type === "PUNCTUATION") {
                        return <span key={i}>{token.text}</span>
                      }
                      const status = (token.status ?? "NONE") as TextTokenStatus
                      const clickable = status === "NEW" || status === "LEARNING"
                      return (
                        <span
                          key={i}
                          className={getTokenStatusClass(status)}
                          onClick={() => clickable && handleTokenClick(token, i)}
                          onKeyDown={(e) => {
                            if (clickable && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault()
                              handleTokenClick(token, i)
                            }
                          }}
                          role={clickable ? "button" : undefined}
                          tabIndex={clickable ? 0 : undefined}
                        >
                          {token.text}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {minedWord && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  onClick={() => setMinedWord(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="mine-dialog-title"
                >
                  <div
                    className="glass-panel rounded-xl p-6 max-w-md w-full border border-white/10 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 id="mine-dialog-title" className="text-lg font-bold text-white mb-3">
                      Mine card
                    </h2>
                    <p className="text-gray-300 mb-2 font-reader">"{minedWord.sentence}"</p>
                    <p className="text-sm text-gray-500 mb-3">
                      Target: <strong className="text-cyan-400">{minedWord.word}</strong>
                      {minedWord.lemma && minedWord.lemma !== minedWord.word && (
                        <span className="ml-1">(lemma: {minedWord.lemma})</span>
                      )}
                    </p>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Translation *
                    </label>
                    <input
                      type="text"
                      value={translation}
                      onChange={(e) => setTranslation(e.target.value)}
                      placeholder="e.g. Чудище / Бегемот"
                      className="w-full bg-app-bg border border-white/5 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-brand-primary focus:outline-none mb-4"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setMinedWord(null)}
                        className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleMine}
                        disabled={!translation.trim() || captureMutation.isPending}
                        className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                      >
                        {captureMutation.isPending ? (
                          <i className="fas fa-spinner fa-spin" />
                        ) : (
                          "+ Mine"
                        )}
                      </button>
                    </div>
                    {captureMutation.isError && (
                      <p className="mt-2 text-sm text-rose-400">
                        {captureMutation.error instanceof Error
                          ? captureMutation.error.message
                          : "Failed to create card."}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {successMessage && (
                <div
                  role="status"
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-emerald-500/90 text-white text-sm font-medium shadow-lg"
                >
                  {successMessage}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

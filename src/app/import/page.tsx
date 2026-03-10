"use client"

import { useState, useMemo, useCallback } from "react"
import { useProjectContext } from "@/contexts/project-context"
import { useDeckTree } from "@/lib/react-query/queries"
import { parseCsvPreview } from "@/lib/utils/parse-csv-preview"
import { getLeafDecksFromTree } from "@/lib/utils/deck-tree-utils"
import {
  startImport,
  type ImportConfig,
  type ImportColumnMapping,
  type ImportJobResponse,
} from "@/lib/api/import-client"
import { ApiError } from "@/lib/api/errors"

const PREVIEW_ROWS = 5

export default function ImportPage() {
  // Файл и превью после парсинга
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  // Маппинг колонок: индексы для sentence, translation, target
  const [mapping, setMapping] = useState<ImportColumnMapping>({
    sentence: 0,
    translation: 1,
    target: 2,
  })
  const [deckId, setDeckId] = useState("")
  const [duplicateStrategy, setDuplicateStrategy] = useState<"SKIP" | "OVERWRITE">("SKIP")
  const [submitLoading, setSubmitLoading] = useState(false)
  const [jobResult, setJobResult] = useState<ImportJobResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { currentProject } = useProjectContext()
  const projectId = currentProject?.id ?? ""
  const { data: deckTree } = useDeckTree(projectId, "mine")

  // Листовые колоды для выбора (только узлы без детей)
  const leafDecks = useMemo(
    () => (deckTree && deckTree.length > 0 ? getLeafDecksFromTree(deckTree) : []),
    [deckTree]
  )

  // Варианты для маппинга: заголовки или Col0, Col1, …
  const columnOptions = useMemo(() => {
    if (!preview?.headers?.length) return []
    return preview.headers.map((h, i) => ({
      value: i,
      label: (h && h.trim()) ? h : `Col${i}`,
    }))
  }, [preview])

  // Anki .apkg — бинарный формат, превью CSV не применимо (Docs: API поддерживает CSV, TSV, Anki PKG).
  const isAnkiFile = useMemo(
    () => file?.name?.toLowerCase().endsWith(".apkg") ?? false,
    [file?.name]
  )

  // После выбора файла — парсим превью (только для CSV/TSV) и сбрасываем маппинг по умолчанию
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      setFile(f ?? null)
      setPreview(null)
      setJobResult(null)
      setError(null)
      if (!f) return
      const nameLower = f.name.toLowerCase()
      if (nameLower.endsWith(".apkg")) {
        // Формат Anki — маппинг колонок не требуется, превью не показываем
        return
      }
      try {
        const data = await parseCsvPreview(f, PREVIEW_ROWS)
        setPreview(data)
        const len = data.headers.length
        setMapping({
          sentence: len > 0 ? 0 : 0,
          translation: len > 1 ? 1 : 0,
          target: len > 2 ? 2 : 0,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка чтения файла")
      }
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    if (!file || !deckId) {
      setError("Выберите файл и колоду")
      return
    }
    setSubmitLoading(true)
    setError(null)
    setJobResult(null)
    const config: ImportConfig = {
      deckId,
      mapping,
      duplicateStrategy,
    }
    try {
      const result = await startImport(file, config)
      setJobResult(result)
    } catch (err) {
      const message =
        err instanceof ApiError ? (err.detail ?? err.message) : (err instanceof Error ? err.message : "Ошибка импорта")
      setError(message)
    } finally {
      setSubmitLoading(false)
    }
  }, [file, deckId, mapping, duplicateStrategy])

  // Для CSV/TSV нужен превью (и маппинг); для Anki — только файл и колода
  const canSubmit = Boolean(
    file && deckId && !submitLoading && (isAnkiFile || preview)
  )

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Import</h1>
          <p className="text-gray-400">Импорт карточек из CSV, TSV или Anki (.apkg)</p>
        </div>

        <div className="glass-panel rounded-xl p-8 space-y-8">
          {/* Шаг 1 — загрузка файла */}
          <section>
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Файл</h2>
            <input
              type="file"
              accept=".csv,.tsv,.apkg,text/csv,text/tab-separated-values"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-app-surface file:text-white file:cursor-pointer"
            />
            {isAnkiFile && (
              <p className="mt-2 text-sm text-gray-400">
                Формат Anki (.apkg) — маппинг колонок не требуется.
              </p>
            )}
            {preview && (
              <div className="mt-4 overflow-x-auto">
                <p className="text-xs text-gray-500 mb-2">Превью (до {PREVIEW_ROWS} строк)</p>
                <table className="w-full text-sm border border-app-border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-app-surface/80">
                      {preview.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left text-gray-400 font-medium border-b border-app-border">
                          {(h && h.trim()) ? h : `Col${i}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-app-border/50">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-2 text-white">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Шаг 2 — маппинг колонок (только для CSV/TSV; для Anki не используется) */}
          {!isAnkiFile && preview && columnOptions.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Маппинг колонок</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sentence</label>
                  <select
                    value={mapping.sentence}
                    onChange={(e) => setMapping((m) => ({ ...m, sentence: Number(e.target.value) }))}
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {columnOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Translation</label>
                  <select
                    value={mapping.translation}
                    onChange={(e) => setMapping((m) => ({ ...m, translation: Number(e.target.value) }))}
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {columnOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Target</label>
                  <select
                    value={mapping.target}
                    onChange={(e) => setMapping((m) => ({ ...m, target: Number(e.target.value) }))}
                    className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {columnOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Выбор колоды */}
          <section>
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Колода</h2>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full max-w-md bg-app-bg border border-app-border rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">— Выберите колоду —</option>
              {leafDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            {projectId && leafDecks.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Нет листовых колод в проекте. Создайте колоду в библиотеке.</p>
            )}
          </section>

          {/* Стратегия дубликатов */}
          <section>
            <h2 className="text-sm font-semibold text-gray-300 mb-3">Дубликаты</h2>
            <select
              value={duplicateStrategy}
              onChange={(e) => setDuplicateStrategy(e.target.value as "SKIP" | "OVERWRITE")}
              className="w-full max-w-md bg-app-bg border border-app-border rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="SKIP">SKIP — пропускать</option>
              <option value="OVERWRITE">OVERWRITE — перезаписывать</option>
            </select>
          </section>

          {/* Кнопка и результат */}
          <section className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-primary px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Загрузка…
                </>
              ) : (
                "Запустить импорт"
              )}
            </button>
          </section>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {jobResult && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm space-y-2">
              <p className="font-medium">Импорт запущен</p>
              <p className="text-gray-400">jobId: {jobResult.jobId}</p>
              {jobResult.message != null && jobResult.message !== "" && (
                <p>{jobResult.message}</p>
              )}
              {jobResult.estimatedTimeSeconds != null && (
                <p>≈ {jobResult.estimatedTimeSeconds} с</p>
              )}
              {/* TODO: В Docs (Описание REST API.md, SR-VOC-06) указан опрос статуса через «отдельный эндпоинт», но сам эндпоинт (GET /jobs/{id}) не описан. После появления эндпоинта — реализовать poll и отображать QUEUED/RUNNING/COMPLETED/FAILED. */}
              <p className="text-xs text-gray-500 mt-2">
                Обновите страницу или перейдите в колоду позже для проверки результата.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

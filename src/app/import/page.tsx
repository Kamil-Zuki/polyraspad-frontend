"use client"

import { useState, useMemo, useCallback, useRef } from "react"
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
import {
  UploadCloud,
  FileBox,
  Database,
  Layers,
  Settings2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  TextSelect,
  Languages,
  Target,
  FileArchive
} from "lucide-react"
import { cn } from "@/lib/utils"

const PREVIEW_ROWS = 5

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null)
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

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { currentProject } = useProjectContext()
  const projectId = currentProject?.id ?? ""
  const { data: deckTree } = useDeckTree(projectId, "mine")

  const leafDecks = useMemo(
    () => (deckTree && deckTree.length > 0 ? getLeafDecksFromTree(deckTree) : []),
    [deckTree]
  )

  const columnOptions = useMemo(() => {
    if (!preview?.headers?.length) return []
    return preview.headers.map((h, i) => ({
      value: i,
      label: (h && h.trim()) ? h : `Column ${i + 1}`,
    }))
  }, [preview])

  const isAnkiFile = useMemo(
    () => file?.name?.toLowerCase().endsWith(".apkg") ?? false,
    [file?.name]
  )

  const processFile = async (f: File) => {
    setFile(f)
    setPreview(null)
    setJobResult(null)
    setError(null)
    
    const nameLower = f.name.toLowerCase()
    if (nameLower.endsWith(".apkg")) {
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
      setError(err instanceof Error ? err.message : "Failed to read file")
    }
  }

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) await processFile(f)
      // Clear input value so selecting the same file again triggers onChange
      if (e.target) e.target.value = ""
    },
    []
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files?.[0]
      if (f) await processFile(f)
    },
    []
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!file || !deckId) {
      setError("Select a file and a deck")
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
        err instanceof ApiError ? (err.detail ?? err.message) : (err instanceof Error ? err.message : "Import failed")
      setError(message)
    } finally {
      setSubmitLoading(false)
    }
  }, [file, deckId, mapping, duplicateStrategy])

  const canSubmit = Boolean(
    file && deckId && !submitLoading && (isAnkiFile || preview)
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shrink-0 shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.2)]">
            <Database className="text-brand-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Import Cards</h1>
            <p className="text-sm text-gray-400 mt-1">
              Quickly populate your decks from CSV, TSV, or Anki packages.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* File Upload Zone */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileBox className="w-4 h-4 text-brand-secondary" />
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Source File</h2>
            </div>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "relative group flex flex-col items-center justify-center p-10 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden",
                isDragging 
                  ? "border-brand-primary bg-brand-primary/5" 
                  : file 
                    ? "border-brand-secondary/30 bg-app-surface hover:border-brand-secondary/50" 
                    : "border-white/10 bg-app-surface/50 hover:border-white/20 hover:bg-app-surface"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.apkg,text/csv,text/tab-separated-values"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div className="flex flex-col items-center text-center space-y-3 z-10">
                  <div className="w-16 h-16 rounded-full bg-brand-secondary/20 flex items-center justify-center">
                    {isAnkiFile ? <FileArchive className="w-8 h-8 text-brand-secondary" /> : <FileSpreadsheet className="w-8 h-8 text-brand-secondary" />}
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg">{file.name}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {(file.size / 1024).toFixed(1)} KB &bull; Click or drag to change file
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-4 z-10">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Click to browse or drag and drop</p>
                    <p className="text-sm text-gray-500 mt-1">Supports .csv, .tsv, and .apkg formats</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Anki Format Notice */}
          {isAnkiFile && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-200">Anki Package Detected</p>
                <p className="text-xs text-blue-300/70 mt-1">Column mapping is not required for Anki files. All cards and media will be extracted automatically.</p>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {!isAnkiFile && preview && (
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-brand-secondary" />
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Data Preview</h2>
                </div>
                <span className="text-xs text-gray-500 font-medium px-2 py-1 rounded bg-white/5">First {PREVIEW_ROWS} rows</span>
              </div>
              
              <div className="rounded-2xl border border-white/10 bg-app-surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                      <tr>
                        {preview.headers.map((h, i) => (
                          <th key={i} className="px-4 py-3 font-medium border-b border-white/5 whitespace-nowrap">
                            <span className="text-brand-secondary/70 mr-1.5 font-mono">[{i}]</span>
                            {(h && h.trim()) ? h : `Column ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {preview.rows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-white/[0.02] transition-colors">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-3 text-gray-200 truncate max-w-[200px]" title={cell}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Column Mapping */}
            {!isAnkiFile && preview && columnOptions.length > 0 && (
              <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="w-4 h-4 text-brand-secondary" />
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Map Columns</h2>
                </div>
                
                <div className="glass-panel p-5 rounded-3xl border-app-border grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
                      <TextSelect className="w-3.5 h-3.5 text-blue-400" />
                      Expression / Sentence
                    </label>
                    <select
                      value={mapping.sentence}
                      onChange={(e) => setMapping((m) => ({ ...m, sentence: Number(e.target.value) }))}
                      className="w-full bg-app-bg border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-brand-primary outline-none transition-colors"
                    >
                      {columnOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          [{opt.value}] {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
                      <Languages className="w-3.5 h-3.5 text-green-400" />
                      Translation
                    </label>
                    <select
                      value={mapping.translation}
                      onChange={(e) => setMapping((m) => ({ ...m, translation: Number(e.target.value) }))}
                      className="w-full bg-app-bg border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-brand-primary outline-none transition-colors"
                    >
                      {columnOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          [{opt.value}] {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-400">
                      <Target className="w-3.5 h-3.5 text-purple-400" />
                      Target Word
                    </label>
                    <select
                      value={mapping.target}
                      onChange={(e) => setMapping((m) => ({ ...m, target: Number(e.target.value) }))}
                      className="w-full bg-app-bg border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-brand-primary outline-none transition-colors"
                    >
                      {columnOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          [{opt.value}] {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* Target Deck */}
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-brand-secondary" />
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Target Deck</h2>
              </div>
              <div className="glass-panel p-5 rounded-3xl border-app-border h-full flex flex-col justify-center">
                <select
                  value={deckId}
                  onChange={(e) => setDeckId(e.target.value)}
                  className="w-full bg-app-bg border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-primary outline-none transition-colors"
                >
                  <option value="" disabled>Select destination deck...</option>
                  {leafDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
                {projectId && leafDecks.length === 0 && (
                  <p className="text-xs text-red-400 mt-3 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    No decks available. Create one first.
                  </p>
                )}
              </div>
            </section>

            {/* Duplicates Strategy */}
            <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
              <div className="flex items-center gap-2 mb-3">
                <Settings2 className="w-4 h-4 text-brand-secondary" />
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Duplicates</h2>
              </div>
              <div className="glass-panel p-5 rounded-3xl border-app-border h-full flex flex-col justify-center">
                <select
                  value={duplicateStrategy}
                  onChange={(e) => setDuplicateStrategy(e.target.value as "SKIP" | "OVERWRITE")}
                  className="w-full bg-app-bg border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-brand-primary outline-none transition-colors"
                >
                  <option value="SKIP">Skip existing cards</option>
                  <option value="OVERWRITE">Overwrite existing cards</option>
                </select>
                <p className="text-xs text-gray-500 mt-3">
                  {duplicateStrategy === "SKIP" 
                    ? "Cards that already exist in your library will be ignored." 
                    : "Existing cards will be updated with the new data."}
                </p>
              </div>
            </section>

          </div>

          {/* Action Area */}
          <section className="pt-4 flex flex-col items-center gap-4">
            {error && (
              <div className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {jobResult && (
              <div className="w-full p-5 rounded-2xl bg-green-500/10 border border-green-500/20 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <h3 className="text-lg font-semibold text-green-300">Import Started Successfully</h3>
                </div>
                <div className="pl-9 space-y-1 text-sm text-green-200/80">
                  <p>Job ID: <span className="font-mono text-xs opacity-70">{jobResult.jobId}</span></p>
                  {jobResult.message && <p>{jobResult.message}</p>}
                  {jobResult.estimatedTimeSeconds != null && (
                    <p>Estimated time: ~{jobResult.estimatedTimeSeconds} seconds</p>
                  )}
                  <p className="pt-2 text-xs opacity-60">You can safely leave this page. Check your deck later to see the imported cards.</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                "group relative w-full sm:w-auto overflow-hidden rounded-2xl px-10 py-4 text-sm font-bold text-white transition-all duration-300",
                canSubmit 
                  ? "bg-brand-primary hover:bg-brand-primary/90 hover:shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.4)] hover:scale-[1.02]" 
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              )}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {submitLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    Start Import
                  </>
                )}
              </div>
            </button>
          </section>

        </div>
      </div>
    </div>
  )
}

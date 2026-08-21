"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { ROUTES } from "@/lib/constants"
import { uploadDocument, uploadImage, saveReaderLibraryBook, generateAudio, formatGenerateAudioUserMessage, getReaderLibrary, fetchDocumentBytes } from "@/lib/api/media-client"
import { useProjectContext } from "@/contexts/project-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ImagePlus, Music, Save, ArrowLeft, Loader2, Volume2, Square, Lock, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBrowserTts } from "@/hooks/use-browser-tts"
import type { ReaderLibraryBook } from "@/app/reader/library-storage"

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]

function isImportedBook(book: ReaderLibraryBook | null): boolean {
  if (!book) return false
  if (book.readingMode === "text-workspace") return false
  const lower = (book.fileName || "").toLowerCase()
  if (lower.endsWith(".pdf") || lower.endsWith(".epub")) return true
  if (book.readingMode === "pdf" || book.readingMode === "epub" || book.readingMode === "txt" || book.readingMode === "import") return true
  return book.readingMode !== "text-workspace" && book.readingMode !== "text"
}

export default function TextWorkspaceEditor() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editBookId = searchParams.get("bookId")
  const { currentProject } = useProjectContext()
  
  const { speak, cancel, isSpeaking } = useBrowserTts({ targetLang: currentProject?.targetLang })

  const [editingBook, setEditingBook] = useState<ReaderLibraryBook | null>(null)
  const [isLoadingBook, setIsLoadingBook] = useState(false)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [cefrLevel, setCefrLevel] = useState("B1")
  const [summary, setSummary] = useState("")
  
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isImported = isImportedBook(editingBook)

  useEffect(() => {
    if (!editBookId || !currentProject) return

    let cancelled = false
    setIsLoadingBook(true)

    getReaderLibrary(currentProject.id)
      .then(async (libraryBooks) => {
        if (cancelled) return
        const target = libraryBooks.find((b) => b.id === editBookId)
        if (!target) {
          toast.error("Book not found")
          return
        }

        setEditingBook(target)
        setTitle(target.title || "")
        setCefrLevel(target.cefrLevel || "B1")
        setSummary(target.summary || "")
        setCoverPreview(target.coverImageUrl || null)
        setAudioUrl(target.audioUrl || null)

        if (target.url) {
          const lower = (target.fileName || "").toLowerCase()
          const isBinaryDoc = lower.endsWith(".pdf") || lower.endsWith(".epub") || target.readingMode === "pdf" || target.readingMode === "epub"
          if (!isBinaryDoc) {
            try {
              const buffer = await fetchDocumentBytes(target.url)
              const text = new TextDecoder("utf-8").decode(buffer)
              if (!cancelled) {
                setContent(text)
              }
            } catch (err) {
              console.error("Failed to load book content bytes", err)
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load book details")
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBook(false)
      })

    return () => {
      cancelled = true
    }
  }, [editBookId, currentProject])

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleGenerateAudio = async () => {
    const textToRead = content.trim() || summary.trim() || title.trim()
    if (!textToRead) {
      toast.error("Please enter some text first")
      return
    }
    
    setIsGeneratingAudio(true)
    if (isSpeaking) cancel()
    
    try {
      const response = await generateAudio({ 
        text: textToRead,
        language: currentProject?.targetLang || "en"
      })
      setAudioUrl(response.url)
      toast.success("Audio generated successfully!")
    } catch (error) {
      toast.error(formatGenerateAudioUserMessage(error))
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentProject) throw new Error("No active project")
      if (!title.trim()) throw new Error("Title is required")
      if (!isImported && !content.trim()) throw new Error("Content is required")

      // 1. Upload cover image if provided
      let finalCoverUrl = editingBook?.coverImageUrl || ""
      if (coverFile) {
        const coverRes = await uploadImage(coverFile)
        finalCoverUrl = coverRes.url
      }

      const now = new Date().toISOString()

      // 2. If editing an imported book: PRESERVE original document, format, fileName, readingMode, pageCount
      if (isImported && editingBook) {
        return saveReaderLibraryBook(currentProject.id, editingBook.id, {
          title: title.trim(),
          fileName: editingBook.fileName,
          documentId: editingBook.documentId,
          pageCount: editingBook.pageCount,
          uploadedAt: editingBook.uploadedAt || now,
          lastOpenedAt: now,
          lastReadPage: editingBook.lastReadPage || 0,
          collectionId: editingBook.collectionId || "",
          collectionName: editingBook.collectionName || "",
          readingMode: editingBook.readingMode || "pdf",
          hasExtractedText: editingBook.hasExtractedText,
          coverImageUrl: finalCoverUrl,
          audioUrl: audioUrl ?? "",
          cefrLevel,
          summary: summary.trim()
        })
      }

      // 3. For Text Workspace: Upload text document and save
      const blob = new Blob([content], { type: "text/plain" })
      const textFile = new File([blob], `${title.replace(/\s+/g, "_")}.txt`, { type: "text/plain" })
      const docRes = await uploadDocument(textFile)

      const targetBookId = editingBook?.id ?? docRes.documentId ?? crypto.randomUUID()
      
      return saveReaderLibraryBook(currentProject.id, targetBookId, {
        title: title.trim(),
        fileName: textFile.name,
        documentId: docRes.documentId ?? editingBook?.documentId,
        uploadedAt: editingBook?.uploadedAt || now,
        lastOpenedAt: now,
        lastReadPage: editingBook?.lastReadPage || 0,
        collectionId: editingBook?.collectionId || "",
        collectionName: editingBook?.collectionName || "",
        readingMode: "text-workspace",
        hasExtractedText: true,
        coverImageUrl: finalCoverUrl,
        audioUrl: audioUrl ?? "",
        cefrLevel,
        summary: summary.trim()
      })
    },
    onSuccess: (book) => {
      toast.success(
        isImported
          ? "Book details updated successfully!"
          : editingBook
            ? "Text workspace updated successfully!"
            : "Text workspace saved successfully!"
      )
      router.push(`${ROUTES.READER}?bookId=${encodeURIComponent(book.id)}`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save workspace")
    }
  })

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-gray-400">
        Please select a project first.
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isImported ? "Edit Book Details" : editingBook ? "Edit Text Workspace" : "New Text Workspace"}
            </h1>
            <p className="text-sm text-gray-400">
              {isImported
                ? "Modify book title, cover, summary, CEFR level, or audio. Original document content and format are preserved."
                : editingBook
                  ? "Modify your self-made book with text, cover, and audio."
                  : "Create a self-made book with text, cover, and audio."}
            </p>
          </div>
        </div>

        {isLoadingBook ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading book details...</span>
          </div>
        ) : (

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Book title..."
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-gray-500 focus:border-brand-primary/50 focus:outline-none"
              />
            </div>

            {isImported ? (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                    <Lock className="w-4 h-4" />
                    <span>Original Document Content (Locked)</span>
                  </div>
                  <span className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-xs text-gray-400 font-mono">
                    {editingBook?.fileName}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  This book was imported from an external file (<strong className="text-gray-300">{editingBook?.fileName}</strong>). Text content and file format cannot be modified to preserve document integrity. Text editing is only available for materials created in the <strong className="text-gray-300">Text workspace</strong>.
                </p>
                {content ? (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs text-gray-500 font-medium">Text preview (read-only):</label>
                    <textarea
                      value={content}
                      readOnly
                      disabled
                      className="w-full h-[220px] resize-none rounded-xl border border-white/5 bg-black/30 px-4 py-3 text-xs text-gray-400 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-xs text-gray-400 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                    <span>Original {editingBook?.fileName?.split(".").pop()?.toUpperCase() || "document"} format preserved ({editingBook?.pageCount ? `${editingBook.pageCount} pages/chapters` : "original file"}).</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-300">Content</label>
                  <span className="text-xs text-gray-500">{content.length} characters</span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your text here..."
                  className="w-full h-[400px] resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-gray-500 focus:border-brand-primary/50 focus:outline-none"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Summary (Optional)</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief description..."
                className="w-full h-24 resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-gray-500 focus:border-brand-primary/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5">
              <h3 className="text-sm font-medium text-white mb-2">Book Metadata</h3>
              
              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Cover Image</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleCoverSelect} 
                  className="hidden" 
                />
                
                {coverPreview ? (
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Change Cover</span>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-white hover:border-white/30 transition bg-black/20"
                  >
                    <ImagePlus className="w-8 h-8" />
                    <span className="text-sm">Upload Cover</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">CEFR Level</label>
                <select
                  value={cefrLevel}
                  onChange={(e) => setCefrLevel(e.target.value)}
                  className="w-full h-10 appearance-none rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white focus:border-brand-primary/50 focus:outline-none"
                >
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Audio Options</label>
                
                <div className="space-y-3">
                  {/* Browser TTS Option */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Browser TTS</span>
                      <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Free</span>
                    </div>
                    <p className="text-xs text-gray-400">Listen to your text immediately using your device's built-in voices.</p>
                    <button
                      onClick={() => {
                        if (isSpeaking) {
                          cancel()
                        } else {
                          const textToSpeak = content.trim() || summary.trim() || title.trim()
                          if (!textToSpeak) {
                            toast.error("Please enter some text first")
                            return
                          }
                          speak(textToSpeak)
                        }
                      }}
                      className={cn(
                        "w-full py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2",
                        isSpeaking
                          ? "border border-brand-primary/50 bg-brand-primary/20 text-brand-primary"
                          : "border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                      )}
                    >
                      {isSpeaking ? (
                        <><Square className="w-4 h-4 fill-current" /> Stop Listening</>
                      ) : (
                        <><Volume2 className="w-4 h-4" /> Listen Now</>
                      )}
                    </button>
                  </div>

                  {/* AI Generation Option */}
                  <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">AI Audio Book</span>
                      <span className="text-[10px] font-bold tracking-wider text-brand-primary uppercase">Premium</span>
                    </div>
                    <p className="text-xs text-gray-400">Generate a high-quality audio file to save with your book.</p>
                    
                    {audioUrl ? (
                      <div className="mt-2 p-3 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          Audio generated!
                        </div>
                        <audio src={audioUrl} controls className="w-full h-8" />
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateAudio}
                        disabled={isGeneratingAudio || (!content.trim() && !summary.trim() && !title.trim())}
                        className={cn(
                          "w-full py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2",
                          "border border-white/10 bg-white/5 hover:bg-white/10 text-white",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {isGeneratingAudio ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                        ) : (
                          <><Music className="w-4 h-4" /> Generate AI Audio</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !title.trim() || (!isImported && !content.trim())}
              className="w-full py-3.5 rounded-xl bg-brand-primary text-white font-bold transition hover:bg-brand-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-5 h-5" /> {isImported ? "Save Book Details" : "Save Workspace"}</>
              )}
            </button>
          </div>
        </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

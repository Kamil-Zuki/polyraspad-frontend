"use client"

import { useRef } from "react"

interface LibraryUploaderProps {
  isBusy: boolean
  isUploading: boolean
  onUpload: (file: File) => void
  onOpenTextWorkspace: () => void
}

export function LibraryUploader({
  isBusy,
  isUploading,
  onUpload,
  onOpenTextWorkspace,
}: LibraryUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.epub,application/pdf,text/plain,application/epub+zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onUpload(file)
          }
          event.currentTarget.value = ""
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isBusy}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <i className="fas fa-spinner fa-spin" />
            Importing…
          </>
        ) : (
          <>
            <i className="fas fa-file-upload" />
            Import PDF, TXT, or EPUB
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onOpenTextWorkspace}
        className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white hover:bg-white/[0.08]"
      >
        Open text workspace
      </button>
    </>
  )
}

"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { ReaderLibraryBook } from "@/app/reader/library-storage"
import { AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"

interface DeleteBookDialogProps {
  book: ReaderLibraryBook | null
  isOpen: boolean
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteBookDialog({
  book,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteBookDialogProps) {
  const t = useTranslations("reader")

  if (!book) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md border-white/10 bg-[#111723] text-white shadow-2xl">
        <DialogHeader className="gap-3 sm:text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-white">
              {t("deleteBookTitle")}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-300">
              {t("deleteBookDesc", { title: book.title })}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2" />
                {t("deleting")}
              </>
            ) : (
              t("delete")
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

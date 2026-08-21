"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertTriangle, HelpCircle, Info, Loader2 } from "lucide-react"

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<unknown>
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "warning" | "primary"
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  isLoading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)

  const handleConfirm = async () => {
    try {
      setInternalLoading(true)
      await Promise.resolve(onConfirm())
      onClose()
    } catch {
      // Error handling is managed by caller
    } finally {
      setInternalLoading(false)
    }
  }

  const busy = isLoading || internalLoading

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        )
      case "warning":
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <HelpCircle className="h-6 w-6" />
          </div>
        )
      case "primary":
      default:
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
            <Info className="h-6 w-6" />
          </div>
        )
    }
  }

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case "destructive":
        return "bg-rose-600 hover:bg-rose-500 text-white"
      case "warning":
        return "bg-amber-600 hover:bg-amber-500 text-white"
      case "primary":
      default:
        return "bg-brand-primary hover:bg-brand-primary/90 text-white"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !busy) onClose() }}>
      <DialogContent className="max-w-md border-white/10 bg-[#111723] text-white shadow-2xl">
        <DialogHeader className="gap-3 sm:text-left">
          {getIcon()}
          <div>
            <DialogTitle className="text-xl font-bold text-white">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-1 text-sm leading-relaxed text-slate-300">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

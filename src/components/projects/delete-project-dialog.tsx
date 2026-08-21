"use client"

import { useState, useEffect } from "react"
import { useDeleteProject } from "@/lib/react-query/queries"
import { ProjectResponseDto } from "@/lib/api/types"
import { toast } from "sonner"
import { useProjectContext } from "@/contexts/project-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"

interface DeleteProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  project: ProjectResponseDto | null
}

export function DeleteProjectDialog({
  isOpen,
  onClose,
  project,
}: DeleteProjectDialogProps) {
  const [confirmTitle, setConfirmTitle] = useState("")
  const [error, setError] = useState("")
  const deleteProject = useDeleteProject()
  const { currentProject, setCurrentProject } = useProjectContext()

  useEffect(() => {
    if (isOpen) {
      setConfirmTitle("")
      setError("")
    }
  }, [isOpen])

  if (!project) return null

  const isTitleMatch =
    confirmTitle.trim().toLowerCase() === project.title.trim().toLowerCase()

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isTitleMatch) return

    setError("")
    try {
      await deleteProject.mutateAsync(project.id)

      // If current selected project was deleted, reset current project
      if (currentProject?.id === project.id) {
        setCurrentProject(null)
      }

      toast.success(`Проект "${project.title}" и все его данные успешно удалены`)
      onClose()
    } catch (err: any) {
      setError(err.message || "Не удалось удалить проект")
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !deleteProject.isPending) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md border-rose-500/20 bg-app-surface text-white shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shrink-0">
              <Trash2 className="h-5.5 w-5.5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Удалить проект?
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-400 font-medium">
                Это действие необратимо и не подлежит отмене
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="mt-2 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-2 p-4 bg-app-bg/80 border border-white/5 rounded-xl text-sm text-gray-300 space-y-2">
          <p className="font-semibold text-white text-xs uppercase tracking-wider">
            Будут безвозвратно удалены:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
            <li>Все колоды и карточки этого проекта</li>
            <li>Изученные слова, термины и леммы словаря</li>
            <li>История сессий обучения и FSRS прогресс</li>
            <li>Книги Ридера, вырезки и загруженные медиафайлы</li>
          </ul>
        </div>

        <form onSubmit={handleDelete} className="mt-2 space-y-4">
          <div>
            <label
              htmlFor="confirmTitle"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Введите <span className="text-white font-bold">{project.title}</span> для подтверждения:
            </label>
            <input
              id="confirmTitle"
              type="text"
              value={confirmTitle}
              onChange={(e) => setConfirmTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-white/10 rounded-xl bg-app-bg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition text-sm"
              placeholder={project.title}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleteProject.isPending}
              className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!isTitleMatch || deleteProject.isPending}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-2"
            >
              {deleteProject.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> Удалить навсегда
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


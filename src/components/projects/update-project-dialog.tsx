"use client"

import { useState, useEffect } from "react"
import { useUpdateProject } from "@/lib/react-query/queries"
import type { UpdateProjectDto, ProjectResponseDto } from "@/lib/api/types"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Trash2, Loader2, Settings, Archive } from "lucide-react"

interface UpdateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  project: ProjectResponseDto | null
  onOpenDelete?: () => void
}

export function UpdateProjectDialog({
  isOpen,
  onClose,
  project,
  onOpenDelete,
}: UpdateProjectDialogProps) {
  const [title, setTitle] = useState("")
  const [isArchived, setIsArchived] = useState(false)
  const [requestRetention, setRequestRetention] = useState(0.9)
  const [maximumInterval, setMaximumInterval] = useState(36500)
  const [error, setError] = useState("")
  const updateProject = useUpdateProject()

  useEffect(() => {
    if (isOpen && project) {
      setTitle(project.title)
      setIsArchived(project.isArchived)
      setRequestRetention(project.settings?.requestRetention ?? 0.9)
      setMaximumInterval(project.settings?.maximumInterval ?? 36500)
      setError("")
    }
  }, [isOpen, project])

  if (!project) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Укажите название проекта")
      return
    }

    if (requestRetention < 0.7 || requestRetention > 0.99) {
      setError("Желаемое удержание должно быть от 0.70 до 0.99")
      return
    }

    if (maximumInterval < 1 || maximumInterval > 36500) {
      setError("Максимальный интервал должен быть от 1 до 36500 дней")
      return
    }

    try {
      const currentSettings = project.settings
      const settingsChanged =
        !currentSettings ||
        currentSettings.requestRetention !== requestRetention ||
        currentSettings.maximumInterval !== maximumInterval

      const data: UpdateProjectDto = {
        title: title.trim() !== project.title ? title.trim() : undefined,
        isArchived: isArchived !== project.isArchived ? isArchived : undefined,
        settings: settingsChanged
          ? {
              requestRetention,
              maximumInterval,
              enableShortTerm: project.settings?.enableShortTerm ?? false,
              w: project.settings?.w,
            }
          : undefined,
      }

      await updateProject.mutateAsync({ id: project.id, data })
      toast.success("Настройки проекта сохранены")
      onClose()
    } catch (err: any) {
      setError(err.message || "Не удалось обновить проект")
    }
  }

  const handleTriggerDelete = () => {
    onClose()
    if (onOpenDelete) {
      onOpenDelete()
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !updateProject.isPending) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-lg border-white/10 bg-app-surface text-white shadow-2xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-2 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-primary/30 bg-brand-primary/10 text-brand-primary shrink-0">
              <Edit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Редактирование проекта
              </DialogTitle>
              <p className="text-xs text-gray-400">
                {project.sourceLang.toUpperCase()} → {project.targetLang.toUpperCase()}
              </p>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="mt-2 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-2 space-y-5">
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Название проекта
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-white/10 rounded-xl bg-app-bg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition text-sm font-medium"
              placeholder="Название проекта"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-app-bg/60 border border-white/5 rounded-xl">
            <input
              id="isArchived"
              type="checkbox"
              checked={isArchived}
              onChange={(e) => setIsArchived(e.target.checked)}
              className="w-4 h-4 text-brand-primary bg-app-bg border-white/20 rounded focus:ring-brand-primary focus:ring-2 cursor-pointer"
            />
            <label htmlFor="isArchived" className="text-sm font-medium text-gray-200 cursor-pointer flex items-center gap-2">
              <Archive className="w-4 h-4 text-gray-400" />
              Отправить проект в архив
            </label>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Settings className="w-4 h-4 text-brand-primary" />
              Настройки интервального повторения (FSRS)
            </div>

            <div className="space-y-4 bg-app-bg/40 p-4 rounded-xl border border-white/5">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-2">
                  <span>Желаемый уровень запоминания (Retention)</span>
                  <span className="text-brand-primary font-bold text-sm">
                    {Math.round(requestRetention * 100)}%
                  </span>
                </div>
                <input
                  id="requestRetention"
                  type="range"
                  min="0.70"
                  max="0.99"
                  step="0.01"
                  value={requestRetention}
                  onChange={(e) => setRequestRetention(parseFloat(e.target.value))}
                  className="w-full accent-brand-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-medium">
                  <span>70% (Легче)</span>
                  <span>90% (Стандарт)</span>
                  <span>99% (Плотнее)</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="maximumInterval"
                  className="block text-xs font-semibold text-gray-300 mb-1"
                >
                  Максимальный интервал повторения (в днях)
                </label>
                <input
                  id="maximumInterval"
                  type="number"
                  min="1"
                  max="36500"
                  value={maximumInterval}
                  onChange={(e) => setMaximumInterval(parseInt(e.target.value) || 365)}
                  className="w-full px-3 py-2 border border-white/10 rounded-xl bg-app-bg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition text-sm"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Карточки не будут откладываться дальше этого срока.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-3">
            <button
              type="button"
              onClick={handleTriggerDelete}
              className="px-3.5 py-2.5 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Удалить проект
            </button>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={updateProject.isPending}
                className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={updateProject.isPending}
                className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-2"
              >
                {updateProject.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить"
                )}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



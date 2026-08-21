"use client"

import { useState } from "react"
import { useCreateProject } from "@/lib/react-query/queries"
import { useRouter } from "next/navigation"
import { useProjectContext } from "@/contexts/project-context"
import { STUDY_LANGUAGE_PRESETS } from "@/lib/languages/study-language-preferences"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"

interface CreateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateProjectDialog({
  isOpen,
  onClose,
}: CreateProjectDialogProps) {
  const [title, setTitle] = useState("")
  const [sourceLang, setSourceLang] = useState("ru")
  const [targetLang, setTargetLang] = useState("en")
  const [error, setError] = useState("")
  const createProject = useCreateProject()
  const router = useRouter()
  const { setCurrentProject } = useProjectContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const project = await createProject.mutateAsync({
        title,
        sourceLang,
        targetLang,
      })
      // Set as current project
      setCurrentProject(project)
      onClose()
      // Navigate to dashboard after creating project
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to create project")
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !createProject.isPending) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md border-white/10 bg-app-surface text-white shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="gap-2 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-primary/30 bg-brand-primary/10 text-brand-primary shrink-0">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Создать проект
              </DialogTitle>
              <p className="text-xs text-gray-400">
                Новый язык для изучения с FSRS повторениями
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
              required
              className="w-full px-3.5 py-2.5 border border-white/10 rounded-xl bg-app-bg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition text-sm font-medium"
              placeholder="Например: English Mastery"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sourceLang"
                className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
              >
                Язык интерфейса / Перевода
              </label>
              <select
                id="sourceLang"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition text-sm cursor-pointer"
              >
                {STUDY_LANGUAGE_PRESETS.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-app-surface text-white">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="targetLang"
                className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
              >
                Изучаемый язык
              </label>
              <select
                id="targetLang"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2.5 border border-white/10 rounded-xl bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition text-sm cursor-pointer"
              >
                {STUDY_LANGUAGE_PRESETS.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-app-surface text-white">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={createProject.isPending}
              className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-2"
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать проект"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


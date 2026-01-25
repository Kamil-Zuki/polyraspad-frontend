"use client"

import { useState } from "react"
import { useCreateProject } from "@/lib/react-query/queries"
import { useRouter } from "next/navigation"
import { useProjectContext } from "@/contexts/project-context"

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

  if (!isOpen) return null

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
      setError(err.message || "Не удалось создать проект")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="glass-panel rounded-2xl p-8 w-full max-w-md border-app-border animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
            <i className="fas fa-plus text-brand-primary text-lg" />
          </div>
          Create Project
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2"
            >
              Project Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-dark w-full"
              placeholder="e.g., English Mastery"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="sourceLang"
                className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2"
              >
                Source
              </label>
              <select
                id="sourceLang"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="input-dark w-full appearance-none cursor-pointer"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="targetLang"
                className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2"
              >
                Target
              </label>
              <select
                id="targetLang"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="input-dark w-full appearance-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="btn-primary"
            >
              {createProject.isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

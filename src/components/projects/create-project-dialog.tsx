"use client"

import { useState } from "react"
import { useCreateProject } from "@/lib/react-query/queries"
import { useRouter } from "next/navigation"

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
      onClose()
      router.push(`/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message || "Не удалось создать проект")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Создать проект
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Название проекта
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Английский язык"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sourceLang"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Родной язык
              </label>
              <select
                id="sourceLang"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Изучаемый язык
              </label>
              <select
                id="targetLang"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {createProject.isPending ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useUpdateProject } from "@/lib/react-query/queries"
import type { UpdateProjectDto, ProjectResponseDto, SrsSettingsDto } from "@/lib/api/types"

interface UpdateProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  project: ProjectResponseDto
}

export function UpdateProjectDialog({
  isOpen,
  onClose,
  project,
}: UpdateProjectDialogProps) {
  const [title, setTitle] = useState(project.title)
  const [isArchived, setIsArchived] = useState(project.isArchived)
  const [requestRetention, setRequestRetention] = useState(
    project.settings?.requestRetention ?? 0.9
  )
  const [maximumInterval, setMaximumInterval] = useState(
    project.settings?.maximumInterval ?? 36500
  )
  const [error, setError] = useState("")
  const updateProject = useUpdateProject()

  useEffect(() => {
    if (isOpen) {
      setTitle(project.title)
      setIsArchived(project.isArchived)
      setRequestRetention(project.settings?.requestRetention ?? 0.9)
      setMaximumInterval(project.settings?.maximumInterval ?? 36500)
      setError("")
    }
  }, [isOpen, project])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Title is required")
      return
    }

    if (requestRetention < 0.7 || requestRetention > 0.99) {
      setError("Request retention must be between 0.7 and 0.99")
      return
    }

    if (maximumInterval < 1 || maximumInterval > 36500) {
      setError("Maximum interval must be between 1 and 36500")
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
        settings: settingsChanged ? {
          requestRetention,
          maximumInterval,
          enableShortTerm: project.settings?.enableShortTerm ?? false,
          w: project.settings?.w,
        } : undefined,
      }

      await updateProject.mutateAsync({ id: project.id, data })
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to update project")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel rounded-xl p-6 w-full max-w-md border-white/10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <i className="fas fa-edit text-brand-purple" /> Edit Project
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Project Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
              placeholder="Project title"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isArchived"
              type="checkbox"
              checked={isArchived}
              onChange={(e) => setIsArchived(e.target.checked)}
              className="w-4 h-4 text-brand-purple bg-dark-800 border-white/10 rounded focus:ring-brand-purple focus:ring-2"
            />
            <label htmlFor="isArchived" className="text-sm text-gray-300">
              Archive this project
            </label>
          </div>

          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              FSRS Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="requestRetention"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Request Retention ({requestRetention.toFixed(2)})
                </label>
                <input
                  id="requestRetention"
                  type="range"
                  min="0.7"
                  max="0.99"
                  step="0.01"
                  value={requestRetention}
                  onChange={(e) => setRequestRetention(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Range: 0.70 - 0.99
                </div>
              </div>

              <div>
                <label
                  htmlFor="maximumInterval"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Maximum Interval (days)
                </label>
                <input
                  id="maximumInterval"
                  type="number"
                  min="1"
                  max="36500"
                  value={maximumInterval}
                  onChange={(e) => setMaximumInterval(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-dark-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Range: 1 - 36500 days
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProject.isPending}
              className="px-4 py-2 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              {updateProject.isPending ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


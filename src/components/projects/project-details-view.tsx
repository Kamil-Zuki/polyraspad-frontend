"use client"

import { useState } from "react"
import { useUpdateProject } from "@/lib/react-query/queries"
import type { ProjectResponseDto, UpdateProjectDto } from "@/lib/api/types"
import { FsrsSettingsEditor } from "@/components/projects/fsrs-settings-editor"

interface ProjectDetailsViewProps {
  project: ProjectResponseDto
}

export function ProjectDetailsView({ project }: ProjectDetailsViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(project.title)
  const [settings, setSettings] = useState(project.settings)
  const updateProject = useUpdateProject()

  const handleSave = async () => {
    const updateData: UpdateProjectDto = {
      title,
      settings,
    }

    try {
      await updateProject.mutateAsync({ id: project.id, data: updateData })
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update project:", error)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl font-bold bg-dark-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition w-full"
              placeholder="Project title"
            />
          ) : (
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
          )}
        </div>

        {/* Project Info */}
        <div className="glass-panel rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Project Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Source Language</label>
              <p className="text-white font-medium">{project.sourceLang.toUpperCase()}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Target Language</label>
              <p className="text-white font-medium">{project.targetLang.toUpperCase()}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Total Lemmas</label>
              <p className="text-white font-medium">{project.stats?.totalLemmas || 0}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Mature Lemmas</label>
              <p className="text-white font-medium">{project.stats?.matureLemmas || 0}</p>
            </div>
          </div>
        </div>

        {/* FSRS Settings */}
        <div className="glass-panel rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">FSRS Settings</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
              >
                <i className="fas fa-edit mr-2" />
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <FsrsSettingsEditor
              settings={settings}
              onChange={setSettings}
              onSave={handleSave}
              onCancel={() => {
                setIsEditing(false)
                setTitle(project.title)
                setSettings(project.settings)
              }}
              isLoading={updateProject.isPending}
            />
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Request Retention</label>
                <p className="text-white font-medium">
                  {((settings?.requestRetention || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Maximum Interval</label>
                <p className="text-white font-medium">{settings?.maximumInterval || 0} days</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Enable Short Term</label>
                <p className="text-white font-medium">{settings?.enableShortTerm ? "Yes" : "No"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


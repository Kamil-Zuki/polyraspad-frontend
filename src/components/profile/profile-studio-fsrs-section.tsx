"use client"

import { useEffect, useState } from "react"
import { useProjects, useProject, useUpdateProject } from "@/lib/react-query"
import type { ProjectResponseDto, SrsSettingsDto, UpdateProjectDto } from "@/lib/api/types"
import { FsrsSettingsEditor } from "@/components/projects/fsrs-settings-editor"

export function ProfileStudioFsrsSection() {
  const { data: projects, isLoading: projectsLoading } = useProjects(false)
  const [projectId, setProjectId] = useState("")
  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const updateProject = useUpdateProject()

  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState<SrsSettingsDto | undefined>(undefined)

  useEffect(() => {
    if (!projects?.length) {
      setProjectId("")
      return
    }
    setProjectId((current) => {
      if (current && projects.some((p) => p.id === current)) return current
      return projects[0].id
    })
  }, [projects])

  useEffect(() => {
    setSettings(project?.settings)
    setIsEditing(false)
  }, [project?.id, project?.settings])

  const handleSaveFsrs = async () => {
    if (!project || !settings) return
    const data: UpdateProjectDto = { settings }
    await updateProject.mutateAsync({ id: project.id, data })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setSettings(project?.settings)
    setIsEditing(false)
  }

  if (projectsLoading) {
    return (
      <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm text-gray-500">Loading projects…</p>
      </section>
    )
  }

  if (!projects?.length) {
    return (
      <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-white mb-1">FSRS (per project)</h2>
        <p className="text-sm text-gray-500 mt-2">
          Create a language project first to tune FSRS retention and intervals.
        </p>
      </section>
    )
  }

  return (
    <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8 h-fit">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">FSRS (per project)</h2>
          <p className="text-sm text-gray-500">Request retention, maximum interval, and short-term behavior for SRS.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value)
              setIsEditing(false)
            }}
            className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
            aria-label="Project for FSRS settings"
          >
            {projects.map((p: ProjectResponseDto) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.isArchived ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </div>

        {projectLoading && projectId && <p className="text-sm text-gray-500">Loading project…</p>}

        {project && !projectLoading && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-400">
                {project.sourceLang.toUpperCase()} → {project.targetLang.toUpperCase()}
              </p>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-brand-purple/80 hover:bg-brand-purple text-white rounded-lg text-sm font-medium"
                >
                  <i className="fas fa-edit mr-2" />
                  Edit FSRS
                </button>
              ) : null}
            </div>

            {isEditing ? (
              <FsrsSettingsEditor
                settings={settings}
                onChange={setSettings}
                onSave={handleSaveFsrs}
                onCancel={handleCancel}
                isLoading={updateProject.isPending}
              />
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Request retention</span>
                  <p className="text-white font-medium">
                    {((settings?.requestRetention ?? project.settings?.requestRetention ?? 0.9) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Maximum interval</span>
                  <p className="text-white font-medium">
                    {settings?.maximumInterval ?? project.settings?.maximumInterval ?? 36500} days
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Short term intervals</span>
                  <p className="text-white font-medium">
                    {(settings?.enableShortTerm ?? project.settings?.enableShortTerm) !== false ? "On" : "Off"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import { useProjects } from "@/lib/react-query/queries"
import type { ProjectResponseDto } from "@/lib/api/types"
import { DeckTree } from "@/components/decks/deck-tree"

export default function LibraryPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const { data: projects, isLoading: projectsLoading } = useProjects()

  if (projectsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="mb-4">
            <i className="fas fa-layer-group text-6xl text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">No Projects Found</h1>
          <p className="text-gray-400 mb-6">
            Create your first project to start organizing your vocabulary decks
          </p>
        </div>
      </div>
    )
  }

  // If no project selected, select the first one
  const currentProjectId = selectedProjectId || projects[0]?.id || null

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Library</h1>
          <p className="text-gray-400">Browse and manage your vocabulary decks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Project Selector Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-panel rounded-xl p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Projects</h2>
              <div className="space-y-2">
                {projects.map((project: ProjectResponseDto) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      currentProjectId === project.id
                        ? "bg-brand-purple/20 border border-brand-purple/30 text-white"
                        : "bg-dark-700 hover:bg-white/5 text-gray-300"
                    }`}
                  >
                    <div className="font-medium">{project.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {project.sourceLang.toUpperCase()} → {project.targetLang.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deck Tree */}
          <div className="lg:col-span-3">
            <div className="glass-panel rounded-xl p-6">
              {currentProjectId ? (
                <DeckTree projectId={currentProjectId} />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Select a project to view its decks
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


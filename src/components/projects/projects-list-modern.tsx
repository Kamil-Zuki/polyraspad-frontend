"use client"

import { useState } from "react"
import { useProjects } from "@/lib/react-query/queries"
import { ProjectCard } from "./project-card"
import { EmptyProjectsState } from "./empty-projects-state"
import { CreateProjectDialog } from "./create-project-dialog"

export function ProjectsListModern() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { data: projects, isLoading, error, refetch } = useProjects()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(139,92,246,0.2)]" />
          <p className="text-sm text-gray-500 font-medium animate-pulse">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 glass-panel border-red-500/30 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <i className="fas fa-exclamation-triangle text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">Error loading projects</h3>
            <p className="text-sm text-gray-400 mb-4">
              {error instanceof Error ? error.message : "Failed to load projects"}
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm text-brand-primary hover:text-white font-bold transition flex items-center gap-2"
            >
              <i className="fas fa-sync-alt" /> Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return <EmptyProjectsState />
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onUpdate={() => refetch()}
          />
        ))}
        {/* Create New Project Card */}
        <button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-primary/50 hover:bg-white/5 transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center text-center p-8 min-h-[320px]"
        >
          <div className="w-16 h-16 rounded-full bg-app-surface border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300 group-hover:border-brand-primary/50 shadow-lg group-hover:bg-brand-primary/10">
            <i className="fas fa-plus text-2xl text-gray-500 group-hover:text-brand-primary transition" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-primary transition">New Project</h3>
          <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed">Start learning a new language. We'll set up the best SRS settings.</p>
        </button>
      </div>
      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false)
          refetch()
        }}
      />
    </>
  )
}

"use client"

import { useProjects } from "@/lib/react-query/queries"
import { ProjectCard } from "./project-card"
import { EmptyProjectsState } from "./empty-projects-state"

export function ProjectsListModern() {
  const { data: projects, isLoading, error, refetch } = useProjects()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 glass-panel border-red-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <i className="fas fa-exclamation-triangle text-red-400 text-xl" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-400 mb-1">Error loading projects</h3>
            <p className="text-sm text-gray-400 mb-3">
              {error instanceof Error ? error.message : "Failed to load projects"}
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm text-brand-purple hover:text-brand-pink font-medium transition"
            >
              Try again
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onUpdate={() => refetch()}
        />
      ))}
      {/* Create New Project Card */}
      <button className="glass-panel rounded-xl overflow-hidden hover:border-brand-purple/50 transition duration-300 group cursor-pointer relative border-dashed border-2 border-white/10 hover:bg-white/5 flex flex-col items-center justify-center text-center p-6 min-h-[260px]">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-brand-purple group-hover:text-white transition duration-300 text-gray-400">
          <i className="fas fa-plus text-lg" />
        </div>
        <h4 className="text-white font-bold mb-1">Create New Project</h4>
        <p className="text-gray-500 text-xs">Start a new language learning journey</p>
      </button>
    </div>
  )
}

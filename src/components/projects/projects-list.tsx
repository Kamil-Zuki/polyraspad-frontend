"use client"

import { useProjects } from "@/lib/react-query/queries"
import { ProjectCard } from "./project-card"

export function ProjectsList() {
  const { data: projects, isLoading, error, refetch } = useProjects(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error instanceof Error ? error.message : "Failed to load projects"}
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">You do not have any projects yet</p>
        <button
          onClick={() => {
            // TODO: Open create project dialog
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create project
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onUpdate={() => refetch()}
        />
      ))}
    </div>
  )
}

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
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Загрузка проектов...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-red-600 text-xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">Ошибка загрузки</h3>
            <p className="text-sm text-red-700 mb-3">
              {error instanceof Error ? error.message : "Не удалось загрузить проекты"}
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm text-red-700 hover:text-red-900 font-medium underline"
            >
              Попробовать снова
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

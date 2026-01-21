"use client"

import { useEffect, useState } from "react"
import { ProjectResponseDto } from "@/lib/api/types"
import { apiClient } from "@/lib/api/client"
import { ProjectCard } from "./project-card"

export function ProjectsList() {
  const [projects, setProjects] = useState<ProjectResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      setError("")
      const data = await apiClient.getProjects()
      setProjects(data)
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить проекты")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Загрузка проектов...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">У вас пока нет проектов</p>
        <button
          onClick={() => {
            // TODO: Open create project dialog
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Создать проект
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

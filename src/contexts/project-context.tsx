"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { ProjectResponseDto } from "@/lib/api/types"

interface ProjectContextType {
  currentProject: ProjectResponseDto | null
  setCurrentProject: (project: ProjectResponseDto | null) => void
  isLoading: boolean
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

const CURRENT_PROJECT_KEY = "currentProjectId"

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProjectState] = useState<ProjectResponseDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load current project from localStorage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem(CURRENT_PROJECT_KEY)
    if (savedProjectId) {
      // Project will be loaded by components using useProjects
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }, [])

  const setCurrentProject = (project: ProjectResponseDto | null) => {
    setCurrentProjectState(project)
    if (project) {
      localStorage.setItem(CURRENT_PROJECT_KEY, project.id)
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY)
    }
  }

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject, isLoading }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProjectContext must be used within a ProjectProvider")
  }
  return context
}

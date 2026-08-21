"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react"
import { ProjectResponseDto } from "@/lib/api/types"
import { useProjects } from "@/lib/react-query/queries"
import { useAuth } from "@/contexts/auth-context"

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
  const { isAuthenticated } = useAuth()
  const { data: projects } = useProjects(false, { enabled: isAuthenticated })

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

  /** Stable setter so dependents (e.g. sync effects) do not rerun every render */
  const setCurrentProject = useCallback((project: ProjectResponseDto | null) => {
    setCurrentProjectState(project)
    if (typeof window !== "undefined") {
      if (project) {
        localStorage.setItem(CURRENT_PROJECT_KEY, project.id)
      } else {
        localStorage.removeItem(CURRENT_PROJECT_KEY)
      }
    }
  }, [])

  /**
   * Hydrate selection from API + localStorage outside the sidebar.
   * Routes like `/editor`, `/study` render without Sidebar/ProjectSwitcher, so we must restore here.
   */
  useEffect(() => {
    if (!projects || projects.length === 0) return

    if (!currentProject) {
      const savedProjectId =
        typeof window !== "undefined" ? localStorage.getItem(CURRENT_PROJECT_KEY) : null
      const project = savedProjectId
        ? projects.find((p) => p.id === savedProjectId) ?? projects[0]
        : projects[0]
      if (project) setCurrentProject(project)
      return
    }

    const projectExists = projects.some((p) => p.id === currentProject.id)
    if (!projectExists) setCurrentProject(projects[0])
  }, [projects, currentProject, setCurrentProject])

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject, isLoading }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useOptionalProjectContext() {
  return useContext(ProjectContext)
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProjectContext must be used within a ProjectProvider")
  }
  return context
}

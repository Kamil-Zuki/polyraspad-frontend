"use client"

import { useState, useRef, useEffect } from "react"
import { useProjects } from "@/lib/react-query/queries"
import { useProjectContext } from "@/contexts/project-context"
import { ProjectResponseDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import { ChevronDown, Check, FolderOpen, Plus } from "lucide-react"

// Helper to get language flag emoji
function getLanguageFlag(lang: string): string {
  const flags: Record<string, string> = {
    en: "🇬🇧",
    ru: "🇷🇺",
    de: "🇩🇪",
    es: "🇪🇸",
    fr: "🇫🇷",
    it: "🇮🇹",
    pt: "🇵🇹",
    ja: "🇯🇵",
    zh: "🇨🇳",
    ko: "🇰🇷",
  }
  return flags[lang.toLowerCase()] || "🌐"
}

// Helper to get language code abbreviation
function getLanguageCode(lang: string): string {
  return lang.toUpperCase().slice(0, 2)
}

export function ProjectSwitcher({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: projects, isLoading } = useProjects(false)
  const { currentProject, setCurrentProject } = useProjectContext()
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleProjectSelect = (project: ProjectResponseDto) => {
    setCurrentProject(project)
    setIsOpen(false)
    // Optionally navigate to dashboard when switching projects
    router.push("/dashboard")
  }

  const displayProject = currentProject || projects?.[0]
  const targetLang = displayProject?.targetLang || "en"

  if (isLoading || !projects) {
    return (
      <div className="p-4 pb-2">
        <div
          className={cn(
            "w-full bg-app-bg border border-app-border rounded-xl animate-pulse",
            isCollapsed ? "p-3 flex items-center justify-center" : "p-3 flex items-center gap-3"
          )}
        >
          <div className="w-8 h-8 rounded bg-app-hover" />
          {!isCollapsed && (
            <div className="flex-1">
              <div className="h-3 bg-app-hover rounded mb-2" />
              <div className="h-4 bg-app-hover rounded w-20" />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 pb-2 relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-app-bg hover:bg-app-hover border border-app-border transition-all duration-200 rounded-xl group",
          isCollapsed
            ? "p-3 flex items-center justify-center"
            : "p-3 flex items-center justify-between"
        )}
        aria-label={displayProject?.title || "Current Project"}
        title={displayProject?.title || "Current Project"}
      >
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          <div className="w-8 h-8 rounded bg-indigo-900/40 flex items-center justify-center text-lg border border-white/5">
            {getLanguageFlag(targetLang)}
          </div>
          {!isCollapsed && (
            <div className="text-left">
              <div className="text-[10px] text-gray-500 font-bold group-hover:text-brand-primary transition uppercase tracking-wider">
                Current Project
              </div>
              <div className="text-sm font-bold text-gray-100">
                {displayProject?.title || "No Project"}
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <ChevronDown
            className={cn(
              "text-gray-500 w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-2 bg-app-surface border border-app-border rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto custom-scroll",
            isCollapsed ? "left-full top-0 ml-2 w-[280px]" : "left-2 right-2"
          )}
        >
          <div className="p-2">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No projects available
              </div>
            ) : (
              <>
                {projects.map((project) => {
                  const isSelected = currentProject?.id === project.id
                  const projectTargetLang = project.targetLang || "en"
                  return (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                        isSelected
                          ? "bg-brand-primary/20 border border-brand-primary/30"
                          : "hover:bg-app-hover border border-transparent"
                      )}
                    >
                      <div className="w-8 h-8 rounded bg-indigo-900/40 flex items-center justify-center text-lg border border-white/5 shrink-0">
                        {getLanguageFlag(projectTargetLang)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {project.title}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                          {getLanguageCode(project.sourceLang)} → {getLanguageCode(projectTargetLang)}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-brand-primary shrink-0" />
                      )}
                    </button>
                  )
                })}
                <div className="border-t border-app-border mt-2 pt-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      router.push(ROUTES.PROJECTS)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-app-hover transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded bg-app-bg border border-white/5 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="text-sm font-medium text-gray-300">All Projects</div>
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      router.push(ROUTES.PROJECTS)
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-app-hover transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded bg-app-bg border border-white/5 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="text-sm font-medium text-gray-300">Create New Project</div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

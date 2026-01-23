"use client"

import { useState } from "react"
import Link from "next/link"
import { ProjectResponseDto } from "@/lib/api/types"
import { ROUTES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { UpdateProjectDialog } from "./update-project-dialog"
import { useUpdateProject } from "@/lib/react-query/queries"

interface ProjectCardProps {
  project: ProjectResponseDto
  onUpdate?: () => void
}

export function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const updateProject = useUpdateProject()
  const stats = project.stats
  const maturePercentage = stats && stats.totalLemmas > 0
    ? Math.round((stats.matureLemmas / stats.totalLemmas) * 100)
    : 0

  const firstLetter = project.title[0]?.toUpperCase() || "P"

  const handleCardClick = (e: React.MouseEvent) => {
    // Если клик был на кнопке или её дочернем элементе, не переходим по ссылке
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a[href]')) {
      return
    }
    // Переход обрабатывается через Link
  }

  const hasCards = stats && stats.totalLemmas > 0
  const dueCount = stats ? stats.totalLemmas - stats.matureLemmas : 0
  const languagePair = `${project.sourceLang.toUpperCase()} → ${project.targetLang.toUpperCase()}`

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden group cursor-pointer relative transition duration-300",
        "bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-blue-900/40",
        "border border-white/10 hover:border-brand-purple/50",
        "flex flex-col min-h-[260px]"
      )}
    >
      <Link
        href={ROUTES.PROJECT_DETAIL(project.id)}
        className="absolute inset-0 z-0"
        aria-label={`Проект ${project.title}`}
        onClick={handleCardClick}
      />
      
      {/* Top Section - Tag and Actions */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {/* Language Tag */}
        <div className="bg-dark-800/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-medium text-white border border-white/10">
          {languagePair}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            className="bg-dark-800/90 hover:bg-dark-700 text-white p-1.5 rounded transition border border-white/10 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setIsEditDialogOpen(true)
            }}
            title="Edit project"
          >
            <i className="fas fa-pen text-xs" />
          </button>
          <button
            className="bg-dark-800/90 hover:bg-dark-700 text-white p-1.5 rounded transition border border-white/10 backdrop-blur-sm"
            onClick={async (e) => {
              e.stopPropagation()
              e.preventDefault()
              try {
                await updateProject.mutateAsync({
                  id: project.id,
                  data: { isArchived: !project.isArchived },
                })
                onUpdate?.()
              } catch (err) {
                console.error("Failed to toggle archive:", err)
              }
            }}
            title={project.isArchived ? "Unarchive project" : "Archive project"}
          >
            <i className={`fas ${project.isArchived ? "fa-box-open" : "fa-archive"} text-xs`} />
          </button>
        </div>
      </div>

      {/* Archived Badge */}
      {project.isArchived && (
        <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
          Archived
        </div>
      )}

      {/* Content Area - Flex grow to push content to bottom */}
      <div className="flex-1 flex flex-col justify-end p-5 relative z-10">
        {/* Title */}
        <h3 className="text-white font-bold text-2xl mb-2 group-hover:text-brand-purple transition">
          {project.title}
        </h3>
        
        {/* Description */}
        <p className="text-white/80 text-sm mb-4">
          Language learning project
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between">
          {hasCards ? (
            <>
              <div className="flex items-center gap-1.5 text-white/90">
                <i className="fas fa-layer-group text-brand-blue text-sm" />
                <span className="text-sm font-medium">{stats.totalLemmas}</span>
              </div>
              {dueCount > 0 ? (
                <div className="flex items-center gap-1.5 text-green-400">
                  <i className="fas fa-clock text-sm" />
                  <span className="text-sm font-medium">{dueCount} Due</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <i className="fas fa-check text-sm" />
                  <span className="text-sm font-medium">Done</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-white/60 text-sm">No cards yet</div>
          )}
        </div>
      </div>

      {/* Study Button on Hover */}
      <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center rounded-xl z-30 pointer-events-none">
        <Link
          href={ROUTES.PROJECT_DETAIL(project.id)}
          className="bg-white text-dark-900 px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition shadow-lg pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fas fa-play mr-2" /> Study
        </Link>
      </div>

      {/* Edit Dialog */}
      <UpdateProjectDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          onUpdate?.()
        }}
        project={project}
      />
    </div>
  )
}

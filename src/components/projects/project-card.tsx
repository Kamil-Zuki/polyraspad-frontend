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

  return (
    <div
      className={cn(
        "glass-panel rounded-xl overflow-hidden group cursor-pointer relative transition duration-300",
        "hover:border-brand-purple/50 flex flex-row h-36"
      )}
    >
      <Link
        href={ROUTES.PROJECT_DETAIL(project.id)}
        className="absolute inset-0 z-0"
        aria-label={`Проект ${project.title}`}
        onClick={handleCardClick}
      />
      {/* Left Content Area */}
      <div className="flex-1 p-5 flex flex-col relative z-10">
        {/* Language Tags */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            "text-xs font-medium uppercase",
            project.sourceLang === "ru" ? "text-gray-300" : "text-gray-400"
          )}>
            {project.sourceLang.toUpperCase()}
          </span>
          <span className={cn(
            "text-xs font-medium uppercase",
            project.targetLang === "en" ? "text-gray-300 font-semibold" : "text-gray-400"
          )}>
            {project.targetLang.toUpperCase()}
          </span>
        </div>

        {/* Content with Large Letter */}
        <div className="flex items-start gap-4 flex-1">
          {/* Large Letter Icon */}
          <div className="flex-shrink-0">
            <div className="text-7xl font-bold text-white/20 select-none leading-none">
              {firstLetter}
            </div>
          </div>

          {/* Title and Description */}
          <div className="flex-1 flex flex-col justify-between min-h-0">
            <div>
              <h3 className="text-white font-bold text-lg mb-1 group-hover:text-brand-purple transition">
                {project.title}
              </h3>
              <p className="text-gray-400 text-xs mb-3">
                Language learning project
              </p>
            </div>

            {/* Stats or Empty State */}
            <div className="mt-auto">
              {stats && stats.totalLemmas > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-layer-group text-brand-blue" /> {stats.totalLemmas} cards
                    </span>
                    <span className="flex items-center gap-1 text-red-400 font-medium">
                      <i className="fas fa-clock" /> {stats.totalLemmas - stats.matureLemmas} due
                    </span>
                  </div>
                  <div className="w-full h-1 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-blue to-brand-purple rounded-full transition-all"
                      style={{ width: `${maturePercentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 text-right">{maturePercentage}% Mastered</div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">No cards yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Archived Badge */}
        {project.isArchived && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
            Archived
          </div>
        )}
      </div>

      {/* Right Image Placeholder Area */}
      <div className="w-28 h-full relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-700/50 to-dark-800/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-800/80 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-lg bg-dark-700/40 border border-white/10 flex items-center justify-center">
            <i className="fas fa-image text-gray-600/50 text-2xl" />
          </div>
        </div>
      </div>

      {/* Actions on Hover */}
      <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-3 rounded-xl z-30">
        <Link
          href={ROUTES.PROJECT_DETAIL(project.id)}
          className="bg-white text-dark-900 px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition shadow-lg relative z-10"
        >
          <i className="fas fa-play mr-2" /> Study
        </Link>
        <button 
          className="bg-dark-700 text-white px-3 py-2 rounded-lg hover:bg-dark-600 transition border border-white/10 relative z-10"
          onClick={(e) => {
            e.stopPropagation()
            setIsEditDialogOpen(true)
          }}
          title="Edit project"
        >
          <i className="fas fa-pen" />
        </button>
        <button 
          className="bg-dark-700 text-white px-3 py-2 rounded-lg hover:bg-dark-600 transition border border-white/10 relative z-10"
          onClick={async (e) => {
            e.stopPropagation()
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
          <i className={project.isArchived ? "fas fa-box-open" : "fas fa-archive"} />
        </button>
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

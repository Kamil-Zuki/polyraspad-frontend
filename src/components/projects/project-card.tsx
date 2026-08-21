"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ProjectResponseDto } from "@/lib/api/types"
import { ROUTES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { UpdateProjectDialog } from "./update-project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import { useProjectContext } from "@/contexts/project-context"
import { Pencil, Trash2, ArrowRight, Layers, Clock, Play } from "lucide-react"

interface ProjectCardProps {
  project: ProjectResponseDto
  onUpdate?: () => void
}

export function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { setCurrentProject } = useProjectContext()
  const router = useRouter()
  const stats = project.stats
  const maturePercentage = stats && stats.totalTerms > 0
    ? Math.round((stats.knownTerms / stats.totalTerms) * 100)
    : 0

  const handleCardClick = (e: React.MouseEvent) => {
    // If click was on a button or its children, don't navigate
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a[href]')) {
      return
    }
    // Set as current project and navigate to dashboard
    setCurrentProject(project)
    router.push(ROUTES.DASHBOARD)
  }

  const dueCount = stats ? stats.totalTerms - stats.knownTerms : 0
  const languagePair = `${project.sourceLang.toUpperCase()} → ${project.targetLang.toUpperCase()}`

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden group cursor-pointer relative transition-all duration-300",
        "bg-app-surface/60 backdrop-blur-md",
        "border border-app-border hover:border-brand-primary/50",
        "flex flex-col min-h-[320px] shadow-lg hover:-translate-y-1.5 hover:shadow-brand-primary/10"
      )}
    >
      <Link
        href={ROUTES.DASHBOARD}
        className="absolute inset-0 z-0"
        aria-label={`Project ${project.title}`}
        onClick={handleCardClick}
      />

      {/* Top Section - Tag and Actions */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        {/* Language Tag */}
        <div className="bg-app-bg/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-app-border">
          {languagePair}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition duration-200">
          <button
            className="w-7 h-7 rounded-lg bg-app-surface/90 hover:bg-white/10 hover:text-white text-gray-300 transition flex items-center justify-center border border-white/10 backdrop-blur-sm shadow-sm"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setIsEditDialogOpen(true)
            }}
            title="Редактировать проект"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            className="w-7 h-7 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 transition flex items-center justify-center border border-rose-500/20 backdrop-blur-sm shadow-sm"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setIsDeleteDialogOpen(true)
            }}
            title="Удалить проект"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Archived Badge */}
      {project.isArchived && (
        <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-gray-300 border border-app-border uppercase tracking-widest">
          В архиве
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-end p-7 relative z-10">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/10 to-transparent opacity-50 group-hover:opacity-80 transition pointer-events-none" />

        {/* Icon Placeholder */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-2xl mb-5 border border-white/5 group-hover:scale-105 transition duration-300">
          🌐
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-2xl mb-1 group-hover:text-brand-primary transition truncate">
          {project.title}
        </h3>

        <p className="text-gray-400 text-xs mb-5 font-medium">
          Advanced Level • Focus Mode
        </p>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
            <span>Прогресс</span>
            <span className="text-white">{maturePercentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-app-bg rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-500"
              style={{ width: `${maturePercentage}%` }}
            />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-app-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
              <Layers className="w-3.5 h-3.5 text-brand-primary" />
              <span>{stats?.totalTerms || 0}</span>
            </div>
            {dueCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{dueCount} к повторению</span>
              </div>
            )}
          </div>

          <div className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 group-hover:translate-x-1 transition text-brand-secondary">
            Открыть <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Study Button on Hover */}
      <div className="absolute inset-0 bg-app-bg/75 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center rounded-2xl z-30 pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setCurrentProject(project)
            router.push(ROUTES.DASHBOARD)
          }}
          className="bg-white text-app-bg px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition shadow-2xl pointer-events-auto flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-app-bg" /> Открыть проект
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
        onOpenDelete={() => {
          setIsEditDialogOpen(false)
          setIsDeleteDialogOpen(true)
        }}
      />

      {/* Delete Dialog */}
      <DeleteProjectDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          onUpdate?.()
        }}
        project={project}
      />
    </div>
  )
}


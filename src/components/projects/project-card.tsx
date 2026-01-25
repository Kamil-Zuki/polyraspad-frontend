"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ProjectResponseDto } from "@/lib/api/types"
import { ROUTES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { UpdateProjectDialog } from "./update-project-dialog"
import { useUpdateProject } from "@/lib/react-query/queries"
import { useProjectContext } from "@/contexts/project-context"

interface ProjectCardProps {
  project: ProjectResponseDto
  onUpdate?: () => void
}

export function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const updateProject = useUpdateProject()
  const { setCurrentProject } = useProjectContext()
  const router = useRouter()
  const stats = project.stats
  const maturePercentage = stats && stats.totalLemmas > 0
    ? Math.round((stats.matureLemmas / stats.totalLemmas) * 100)
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

  const hasCards = stats && stats.totalLemmas > 0
  const dueCount = stats ? stats.totalLemmas - stats.matureLemmas : 0
  const languagePair = `${project.sourceLang.toUpperCase()} → ${project.targetLang.toUpperCase()}`

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden group cursor-pointer relative transition-all duration-300",
        "bg-app-surface/60 backdrop-blur-md",
        "border border-app-border hover:border-brand-primary/50",
        "flex flex-col min-h-[320px] shadow-lg hover:-translate-y-2 hover:shadow-brand-primary/10"
      )}
    >
      <Link
        href={ROUTES.DASHBOARD}
        className="absolute inset-0 z-0"
        aria-label={`Project ${project.title}`}
        onClick={handleCardClick}
      />
      
      {/* Top Section - Tag and Actions */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Language Tag */}
        <div className="bg-app-bg/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-app-border">
          {languagePair}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-300">
          <button
            className="bg-app-surface/90 hover:bg-app-hover text-white p-1.5 rounded-lg transition border border-app-border backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              setIsEditDialogOpen(true)
            }}
            title="Edit project"
          >
            <i className="fas fa-pen text-xs" />
          </button>
        </div>
      </div>

      {/* Archived Badge */}
      {project.isArchived && (
        <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-app-border uppercase tracking-widest">
          Archived
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-end p-8 relative z-10">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/10 to-transparent opacity-50 group-hover:opacity-80 transition pointer-events-none" />
        
        {/* Icon Placeholder */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-3xl mb-6 border border-white/5 group-hover:scale-110 transition duration-300">
          🌐
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-2xl mb-1 group-hover:text-brand-primary transition">
          {project.title}
        </h3>
        
        <p className="text-gray-400 text-sm mb-6">
          Advanced Level • Focus Mode
        </p>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-wider">
            <span>Progress</span>
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
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              <i className="fas fa-layer-group text-brand-primary" />
              <span>{stats?.totalLemmas || 0}</span>
            </div>
            {dueCount > 0 && (
              <div className="flex items-center gap-1.5 text-status-warning text-xs">
                <i className="fas fa-clock" />
                <span>{dueCount} Due</span>
              </div>
            )}
          </div>
          
          <div className="text-white font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition">
            Open <i className="fas fa-arrow-right text-brand-secondary" />
          </div>
        </div>
      </div>

      {/* Study Button on Hover */}
      <div className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center rounded-2xl z-30 pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setCurrentProject(project)
            router.push(ROUTES.DASHBOARD)
          }}
          className="bg-white text-app-bg px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition shadow-2xl pointer-events-auto flex items-center gap-2"
        >
          <i className="fas fa-play text-xs" /> Open Dashboard
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

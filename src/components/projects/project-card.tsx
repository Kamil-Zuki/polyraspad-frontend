"use client"

import Link from "next/link"
import { ProjectResponseDto } from "@/lib/api/types"
import { ROUTES } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
  project: ProjectResponseDto
}

export function ProjectCard({ project }: ProjectCardProps) {
  const stats = project.stats
  const maturePercentage = stats && stats.totalLemmas > 0
    ? Math.round((stats.matureLemmas / stats.totalLemmas) * 100)
    : 0

  return (
    <Link
      href={ROUTES.PROJECT_DETAIL(project.id)}
      className={cn(
        "glass-panel rounded-xl overflow-hidden group cursor-pointer relative transition duration-300",
        "hover:border-brand-purple/50"
      )}
      aria-label={`Проект ${project.title}`}
    >
      {/* Cover Image Area */}
      <div className="h-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/20 to-brand-blue/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-800 to-transparent" />
        {project.isArchived && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10">
            Archived
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="uppercase font-medium">{project.sourceLang}</span>
            <i className="fas fa-arrow-right text-[8px]" />
            <span className="uppercase font-medium">{project.targetLang}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold shadow-lg">
            {project.title[0]?.toUpperCase() || "P"}
          </div>
          {stats && stats.totalLemmas > 0 && (
            <div className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded border border-green-500/30">
              Active
            </div>
          )}
        </div>

        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-brand-purple transition truncate">
          {project.title}
        </h3>
        <p className="text-gray-400 text-xs mb-4 line-clamp-2">
          Language learning project
        </p>

        {stats && stats.totalLemmas > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <i className="fas fa-layer-group text-brand-blue" /> {stats.totalLemmas} cards
              </span>
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <i className="fas fa-clock" /> {stats.totalLemmas - stats.matureLemmas} due
              </span>
            </div>
            <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-blue to-brand-purple rounded-full transition-all shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                style={{ width: `${maturePercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 text-right">{maturePercentage}% Mastered</div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">No cards yet</div>
        )}

        {/* Actions on Hover */}
        <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-3 rounded-xl">
          <button className="bg-white text-dark-900 px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition shadow-lg">
            <i className="fas fa-play mr-2" /> Study
          </button>
          <button className="bg-dark-700 text-white px-3 py-2 rounded-lg hover:bg-dark-600 transition border border-white/10">
            <i className="fas fa-pen" />
          </button>
        </div>
      </div>
    </Link>
  )
}

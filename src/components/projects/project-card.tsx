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
        "block p-6 bg-white rounded-lg border border-gray-200",
        "hover:shadow-md hover:border-blue-300 transition-all",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      )}
      aria-label={`Проект ${project.title}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="uppercase">{project.sourceLang}</span>
            <span>→</span>
            <span className="uppercase">{project.targetLang}</span>
          </div>
        </div>
        {project.isArchived && (
          <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
            Архив
          </span>
        )}
      </div>

      {stats && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Изучено слов</span>
            <span className="font-medium text-gray-900">
              {stats.matureLemmas} / {stats.totalLemmas}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${maturePercentage}%` }}
            />
          </div>
        </div>
      )}

      {!stats && (
        <div className="text-sm text-gray-500">Нет статистики</div>
      )}
    </Link>
  )
}

import { Suspense } from "react"
import { ProjectsListModern } from "@/components/projects/projects-list-modern"
import { ProjectsPageHeader } from "@/components/projects/projects-page-header"

export const metadata = {
  title: "Проекты | Polyraspad",
  description: "Управление вашими языковыми проектами",
}

export default function HomePage() {
  return (
    <div className="flex-1 p-6 space-y-6">
      <ProjectsPageHeader />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ProjectsListModern />
      </Suspense>
    </div>
  )
}

import { Suspense } from "react"
import { ProjectsListModern } from "@/components/projects/projects-list-modern"
import { ProjectsPageHeader } from "@/components/projects/projects-page-header"

export const metadata = {
  title: "Home | Polyraspad",
  description: "Your language learning dashboard",
}

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Hero / Welcome Section */}
        <section className="mb-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Good Morning
              </h1>
              <p className="text-gray-400 text-sm">
                Manage your language learning projects
              </p>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section>
          <ProjectsPageHeader />
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <div className="mt-6">
              <ProjectsListModern />
            </div>
          </Suspense>
        </section>
      </div>
    </div>
  )
}

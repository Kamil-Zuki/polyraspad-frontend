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
        <section className="mb-12 flex justify-between items-end relative">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Good Evening, Kamil
            </h1>
            <p className="text-gray-500 text-sm">
              You're on a <span className="text-brand-primary font-bold">12-day streak</span>! Keep the momentum going.
            </p>
          </div>
          <div className="flex gap-4">
             {/* Quick Stats from IA */}
             <div className="px-5 py-3 bg-app-surface border border-app-border rounded-xl flex flex-col items-center min-w-[120px]">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Vocabulary</span>
                 <strong className="text-white text-xl">2,540</strong>
             </div>
             <div className="px-5 py-3 bg-app-surface border border-app-border rounded-xl flex flex-col items-center min-w-[120px]">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Retention</span>
                 <strong className="text-status-success text-xl">94%</strong>
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

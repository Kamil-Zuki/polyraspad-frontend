"use client"

import Link from "next/link"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useProjectContext } from "@/contexts/project-context"
import { useProjects } from "@/lib/react-query/queries"

export default function DashboardPage() {
  const { currentProject } = useProjectContext()
  const { data: projects, isLoading: projectsLoading } = useProjects(false)

  const showEmptyState =
    !projectsLoading &&
    projects &&
    (projects.length === 0 || !currentProject)

  return (
    <ProtectedRoute>
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 relative custom-scroll h-full">
        {/* Background Gradient Decoration from IA */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

        {showEmptyState ? (
          <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="glass-panel border border-app-border rounded-2xl p-12 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center mx-auto mb-6 border border-brand-primary/30">
                <i className="fas fa-folder-open text-3xl text-brand-primary" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {projects?.length === 0 ? "Create your first project" : "Select a project"}
              </h2>
              <p className="text-gray-400 text-sm mb-8">
                {projects?.length === 0
                  ? "Add a language project to start building vocabulary and see your dashboard."
                  : "Choose a project from the sidebar or create a new one to view your stats and decks."}
              </p>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition shadow-glow"
              >
                <i className="fas fa-plus" />
                {projects?.length === 0 ? "Create project" : "Go to projects"}
              </Link>
            </div>
          </div>
        ) : (
          <DashboardShell />
        )}
      </div>
    </ProtectedRoute>
  )
}

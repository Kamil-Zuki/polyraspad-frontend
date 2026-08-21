"use client"

import { Suspense, useMemo } from "react"
import { GlobalNav } from "@/components/layout/global-nav"
import { ProjectsListModern } from "@/components/projects/projects-list-modern"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useProjects } from "@/lib/react-query/queries"
import { useUserSettings } from "@/lib/react-query/queries"

export default function ProjectsHubPage() {
  const { data: projects } = useProjects(false) // Only non-archived projects
  const { data: userSettings, isLoading: userSettingsLoading } = useUserSettings()

  // Calculate total words across all projects
  const totalWords = useMemo(() => {
    if (!projects) return 0
    return projects.reduce((sum, project) => {
      return sum + (project.stats?.totalTerms || 0)
    }, 0)
  }, [projects])

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-app-bg relative">
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_50%_0%,#1c2339_0%,#0b0f15_70%)] pointer-events-none" />
        
        <GlobalNav />

        <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3">Welcome back</h1>
              <p className="text-gray-400">Select a project to continue your learning session.</p>
            </div>
            
            {/* Global Stats Widget from IA - Real Data */}
            <div className="flex gap-4">
              <div className="px-6 py-4 rounded-2xl bg-app-surface border border-white/5 flex flex-col items-center shadow-lg">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Total Words</span>
                <span className="text-2xl font-bold text-white tabular-nums">
                  {totalWords.toLocaleString()}
                </span>
              </div>
              <div className="px-6 py-4 rounded-2xl bg-app-surface border border-white/5 flex flex-col items-center shadow-lg">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Day Streak</span>
                <span className="text-2xl font-bold text-brand-secondary flex items-center gap-2 tabular-nums">
                  <i className="fas fa-fire text-orange-400 animate-pulse" />
                  {userSettingsLoading ? "—" : (userSettings?.currentStreak ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[320px] rounded-2xl bg-app-surface/50 border border-white/5 animate-pulse" />
                ))}
              </div>
            }
          >
            <ProjectsListModern />
          </Suspense>
        </main>

        <footer className="w-full border-t border-white/5 py-8 mt-auto relative z-10">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-xs text-gray-600 font-medium tracking-wide">
              &copy; {new Date().getFullYear()} Polyraspad. Deep Immersion Learning Platform.
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  )
}

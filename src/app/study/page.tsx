"use client"

import { useProjects } from "@/lib/react-query/queries"

export default function StudyPage() {
  const { data: projects, isLoading } = useProjects()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="mb-4">
            <i className="fas fa-play text-6xl text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">No Projects Available</h1>
          <p className="text-gray-400 mb-6">
            Create a project first to start studying
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Study Now</h1>
          <p className="text-gray-400">Start your learning session</p>
        </div>

        <div className="glass-panel rounded-xl p-8 text-center">
          <div className="mb-6">
            <i className="fas fa-graduation-cap text-6xl text-brand-purple mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Study Session</h2>
            <p className="text-gray-400">
              Study functionality will be implemented soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


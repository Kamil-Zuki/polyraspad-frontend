"use client"

import { useProjects } from "@/lib/react-query/queries"

export default function BrowserPage() {
  const { data: projects, isLoading } = useProjects()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Card Browser</h1>
          <p className="text-gray-400">Browse and search your vocabulary cards</p>
        </div>

        <div className="glass-panel rounded-xl p-8">
          <div className="text-center">
            <div className="mb-4">
              <i className="fas fa-search text-6xl text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Card Browser</h2>
            <p className="text-gray-400">
              Card browsing and search functionality will be implemented soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


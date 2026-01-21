"use client"

import { useState } from "react"
import { CreateProjectDialog } from "./create-project-dialog"

export function EmptyProjectsState() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-purple/20 to-brand-blue/20 flex items-center justify-center">
          <i className="fas fa-layer-group text-4xl text-brand-purple" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No projects yet
        </h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Create your first language learning project to start your journey
        </p>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-6 py-3 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-2 mx-auto"
        >
          <i className="fas fa-plus" /> Create First Project
        </button>
      </div>
      <CreateProjectDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  )
}

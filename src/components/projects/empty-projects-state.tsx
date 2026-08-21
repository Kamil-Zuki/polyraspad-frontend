"use client"

import { useState } from "react"
import { CreateProjectDialog } from "./create-project-dialog"

export function EmptyProjectsState() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <div className="text-center py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-app-surface/30">
        <div className="w-20 h-20 mb-6 rounded-full bg-app-surface border border-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
          <i className="fas fa-layer-group text-3xl text-brand-primary" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          No projects yet
        </h3>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
          Your language learning journey starts here. Create your first project to organize your vocabulary.
        </p>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="btn-primary flex items-center gap-2 px-8 py-3"
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

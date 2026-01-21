"use client"

import { useState } from "react"
import { CreateProjectDialog } from "./create-project-dialog"

export function ProjectsPageHeader() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <i className="fas fa-layer-group text-brand-purple" /> My Projects
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="bg-brand-purple hover:bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-2"
          >
            <i className="fas fa-plus" /> New Project
          </button>
        </div>
      </div>
      <CreateProjectDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  )
}

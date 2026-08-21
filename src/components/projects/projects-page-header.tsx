"use client"

import { useState } from "react"
import { CreateProjectDialog } from "./create-project-dialog"

export function ProjectsPageHeader() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-layer-group text-brand-primary" /> My Projects
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm py-1.5"
          >
            <i className="fas fa-plus text-xs" /> New Project
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

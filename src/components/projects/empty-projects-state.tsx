"use client"

import { useState } from "react"
import { CreateProjectDialog } from "./create-project-dialog"

export function EmptyProjectsState() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          У вас пока нет проектов
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Создайте свой первый языковой проект, чтобы начать изучение новых слов
        </p>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          + Создать первый проект
        </button>
      </div>
      <CreateProjectDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  )
}

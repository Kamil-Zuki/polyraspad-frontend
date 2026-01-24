"use client"

import { EditorHeader } from "@/components/editor/editor-header"
import { EditorForm } from "@/components/editor/editor-form"
import { AiAssistant } from "@/components/editor/ai-assistant"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function EditorPage() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-app-bg">
        <EditorHeader />
        <div className="flex-1 flex overflow-hidden">
          {/* Main Area */}
          <div className="flex-1 overflow-y-auto relative custom-scroll">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
            <EditorForm />
          </div>

          {/* AI Assistant Sidebar */}
          <AiAssistant />
        </div>
      </div>
    </ProtectedRoute>
  )
}

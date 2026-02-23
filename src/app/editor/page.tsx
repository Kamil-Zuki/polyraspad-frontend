"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { EditorHeader } from "@/components/editor/editor-header"
import { EditorForm } from "@/components/editor/editor-form"
import { CardPreview } from "@/components/editor/card-preview"
import { EditorCardHydrator } from "@/components/editor/editor-card-hydrator"
import { AiAssistant } from "@/components/editor/ai-assistant"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { EditorCardProvider } from "@/contexts/editor-card-context"

export default function EditorPage() {
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  return (
    <ProtectedRoute>
      <EditorCardProvider>
        <EditorCardHydrator />
        <div className="flex flex-col h-screen overflow-hidden bg-app-bg">
          <EditorHeader
            isPreviewMode={isPreviewMode}
            onTogglePreview={() => setIsPreviewMode((v) => !v)}
          />
          <div className="flex-1 flex overflow-hidden">
            {/* Main Area: form + optional preview (split on desktop, stack on mobile) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-w-0">
              <div className="flex-1 overflow-y-auto relative custom-scroll min-w-0 flex flex-col">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <EditorForm />
                  {/* Mobile: preview below form when Preview Mode is on */}
                  <AnimatePresence initial={false}>
                    {isPreviewMode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="md:hidden overflow-hidden px-6 pb-8"
                      >
                        <div className="mt-8 pt-6 border-t border-app-border">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                            Card Preview
                          </div>
                          <div className="max-w-sm mx-auto">
                            <CardPreview />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Desktop: preview panel on the right */}
              <AnimatePresence initial={false}>
                {isPreviewMode && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="hidden md:flex flex-col overflow-hidden border-l border-app-border bg-app-surface/80 shrink-0"
                  >
                    <div className="w-[320px] flex flex-col h-full p-4 overflow-hidden min-w-0">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span>Card Preview</span>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
                        <CardPreview />
                      </div>
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>
            </div>

            <AiAssistant />
          </div>
        </div>
      </EditorCardProvider>
    </ProtectedRoute>
  )
}

"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useProjectContext } from "@/contexts/project-context"
import { useLesson, useLessons, useCompleteLesson, useStartLesson, useRestartLesson } from "@/lib/react-query/lessons"
import { useAgentWorkspace } from "@/lib/agent/use-agent-workspace"
import { AgentWorkspaceShell } from "@/components/agent-workspace/agent-workspace-shell"
import { GraduationCap, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, BookOpen, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface LessonDetailPageProps {
  params: Promise<{ id: string }>
}

export default function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { id: lessonId } = use(params)
  const { currentProject } = useProjectContext()
  const router = useRouter()
  const [isRestartConfirmOpen, setIsRestartConfirmOpen] = useState(false)

  const { data, isLoading: isLessonLoading, error: lessonError } = useLesson(currentProject?.id, lessonId)
  const { data: allLessonsData } = useLessons(currentProject?.id)

  const { mutateAsync: completeLesson, isPending: isCompleting } = useCompleteLesson()
  const { mutateAsync: startLesson } = useStartLesson()
  const { mutateAsync: restartLesson, isPending: isRestarting } = useRestartLesson()

  // Use Study Copilot for lessons
  const workspace = useAgentWorkspace("study-copilot")
  const [threadInitialized, setThreadInitialized] = useState(false)
  const [isStartingAuto, setIsStartingAuto] = useState(false)
  
  // Dynamic Whiteboard state
  const [activeWidget, setActiveWidget] = useState<{ type: string; data: any } | null>(null)

  // Precompute lock states for all lessons
  const lessonLockState = useMemo(() => {
    const items = allLessonsData?.lessons ?? []
    const completedLessonIds = new Set(
      items.filter(l => l.progress?.status === 2).map(l => l.lesson.id)
    )
    
    const lockState: Record<string, boolean> = {}
    
    // Evaluate locked state linearly
    for (let i = 0; i < items.length; i++) {
      const { lesson } = items[i]
      let isLocked = false
      if (lesson.unlocksAfterLessonId) {
        isLocked = !completedLessonIds.has(lesson.unlocksAfterLessonId)
      } else if (i > 0) {
        isLocked = items[i - 1].progress?.status !== 2
      }
      lockState[lesson.id] = isLocked
    }
    
    return lockState
  }, [allLessonsData])

  const isCurrentLessonLocked = lessonLockState[lessonId] ?? false

  // Reset state when lesson changes
  useEffect(() => {
    setThreadInitialized(false)
    setIsStartingAuto(false)
  }, [lessonId])

  // Initialize the agent workspace with the lesson's thread
  useEffect(() => {
    if (!data?.lessonWithProgress || !currentProject) return
    if (isCurrentLessonLocked) return

    const threadId = data.lessonWithProgress.progress?.agentThreadId
    
    if (!threadId && !isStartingAuto) {
      setIsStartingAuto(true)
      startLesson({ projectId: currentProject.id, lessonId }).catch(console.error)
      return
    }

    if (threadId && !threadInitialized && workspace.agent) {
      workspace.selectThread(threadId)
      setThreadInitialized(true)
    }
  }, [data, workspace, threadInitialized, currentProject, lessonId, isStartingAuto, startLesson, isCurrentLessonLocked])

  // Build flat ordered list for prev/next navigation
  const { prevLesson, nextLesson } = useMemo(() => {
    const items = allLessonsData?.lessons ?? []
    const idx = items.findIndex((l) => l.lesson?.id === lessonId)
    return {
      prevLesson: idx > 0 ? items[idx - 1]?.lesson : null,
      nextLesson: idx >= 0 && idx < items.length - 1 ? items[idx + 1]?.lesson : null,
    }
  }, [allLessonsData, lessonId])

  // Build grouped list for TOC (Table of Contents)
  const groupedLessons = useMemo(() => {
    const items = allLessonsData?.lessons ?? []
    const groups = items.reduce((acc, current) => {
      const level = current.lesson.cefrLevel || "Uncategorized"
      if (!acc[level]) acc[level] = []
      acc[level].push(current)
      return acc
    }, {} as Record<string, typeof items>)
    
    const order = ["A1", "A2", "B1", "B2", "C1", "C2", "Uncategorized"]
    const sortedGroups: Array<{ level: string, items: typeof items }> = []
    
    order.forEach(level => {
      if (groups[level] && groups[level].length > 0) {
        groups[level].sort((a, b) => (a.lesson.orderIndex || 0) - (b.lesson.orderIndex || 0))
        sortedGroups.push({ level, items: groups[level] })
      }
    })
    
    return sortedGroups
  }, [allLessonsData])



  if (!currentProject) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Please select a project first.
      </div>
    )
  }

  if (isLessonLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  if (lessonError || !data?.lessonWithProgress) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-red-400">
        <p>Failed to load lesson.</p>
        <Link href="/lessons" className="mt-4 text-brand-primary hover:underline flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lessons
        </Link>
      </div>
    )
  }

  const { lesson, progress } = data.lessonWithProgress
  const isCompleted = progress?.status === 2 // LessonProgressStatus.Completed
  const lessonThreadId = progress?.agentThreadId ?? null

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Panel: Lesson Content */}
      <div className="w-1/2 h-full flex flex-col border-r border-white/10 bg-app-bg">
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/lessons" className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white" title="Back to Map">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white" title="Table of Contents">
                  <BookOpen className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-app-bg border-r border-white/10 p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-white/10 text-left shrink-0">
                  <SheetTitle className="text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand-primary" />
                    Table of Contents
                  </SheetTitle>
                  <SheetDescription className="text-gray-400">
                    Navigate through your curriculum
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-6">
                  {groupedLessons.map(group => (
                    <div key={group.level}>
                      <h3 className="text-sm font-bold text-gray-300 mb-3 px-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                        {group.level} Level
                      </h3>
                      <div className="space-y-1">
                        {group.items.map((item, idx) => {
                          const isActive = item.lesson.id === lessonId
                          const isCompleted = item.progress?.status === 2
                          const isLocked = lessonLockState[item.lesson.id]
                          return isLocked ? (
                            <div 
                              key={item.lesson.id} 
                              className="block px-3 py-2 rounded-lg text-sm text-gray-500 opacity-50 cursor-not-allowed"
                            >
                              <div className="flex items-center gap-2">
                                <span className="opacity-50 text-xs w-4 text-right">{idx + 1}.</span>
                                <span className="truncate flex-1">{item.lesson.title}</span>
                                <Lock className="h-3 w-3 shrink-0" />
                              </div>
                            </div>
                          ) : (
                            <Link 
                              key={item.lesson.id} 
                              href={`/lessons/${item.lesson.id}`}
                              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-brand-primary/20 text-brand-primary font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="opacity-50 text-xs w-4 text-right">{idx + 1}.</span>
                                <span className="truncate flex-1">{item.lesson.title}</span>
                                {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-primary/10">
              <GraduationCap className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">{lesson.title}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className={`px-2 py-0.5 rounded-full border ${lesson.colorCssClass || "bg-blue-500/10 border-blue-500/20 text-blue-400"}`}>
                  {lesson.difficulty || "Beginner"}
                </span>
                <span>{lesson.category || "General"}</span>
              </div>
            </div>
          </div>
          
          {!isCurrentLessonLocked && (
            <div className="flex items-center gap-2">
              <button
                disabled={isRestarting}
                onClick={() => setIsRestartConfirmOpen(true)}
                className="flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors px-3 py-1.5 rounded-full text-sm font-medium border border-white/10 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                {isRestarting ? "Restarting..." : "Restart"}
              </button>
  
              {isCompleted ? (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-400/20">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </div>
              ) : (
                <button
                  disabled={isCompleting}
                  onClick={async () => {
                    try {
                      await completeLesson({ projectId: currentProject.id, lessonId });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="flex items-center gap-2 text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 transition-colors px-3 py-1.5 rounded-full text-sm font-medium border border-brand-primary/20 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleting ? "Marking..." : "Mark as Completed"}
                </button>
              )}
            </div>
          )}
        </div>

        {isCurrentLessonLocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
            <Lock className="h-12 w-12 mb-4 text-gray-600" />
            <h2 className="text-xl font-bold text-white mb-2">Lesson Locked</h2>
            <p>You need to complete the previous lessons to access this content.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 custom-scroll relative">
            {/* Dynamic Whiteboard Area */}
            {activeWidget ? (
              <div className="mb-6 rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-4 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                  <h3 className="text-sm font-semibold text-brand-primary">Interactive Widget: {activeWidget.type}</h3>
                  <button 
                    onClick={() => setActiveWidget(null)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="text-sm text-gray-300">
                  {/* Widget renderer will go here */}
                  <p>Widget data: {JSON.stringify(activeWidget.data)}</p>
                </div>
              </div>
            ) : null}
  
            <div className="prose prose-invert prose-brand max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.contentMarkdown || "No content provided."}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Prev / Next lesson navigation */}
        <div className="shrink-0 border-t border-white/10 px-4 py-3 flex items-center justify-between gap-3">
          {prevLesson ? (
            <button
              onClick={() => router.push(`/lessons/${prevLesson.id}`)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition text-sm max-w-[45%] group"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              <span className="truncate text-left">
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Previous</span>
                {prevLesson.title}
              </span>
            </button>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <button
              onClick={() => {
                if (!lessonLockState[nextLesson.id]) {
                  router.push(`/lessons/${nextLesson.id}`)
                }
              }}
              disabled={lessonLockState[nextLesson.id]}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition text-sm max-w-[45%] group ml-auto ${
                lessonLockState[nextLesson.id] 
                  ? "opacity-40 cursor-not-allowed bg-transparent text-gray-500" 
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <span className="truncate text-right">
                <span className="block text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Next</span>
                {nextLesson.title}
              </span>
              {lessonLockState[nextLesson.id] ? (
                <Lock className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Right Panel: Agent Chat */}
      <div className="w-1/2 h-full bg-app-surface/30">
        {isCurrentLessonLocked ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <Lock className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Chat is unavailable for locked lessons.</p>
          </div>
        ) : !workspace.agent ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <AgentWorkspaceShell
            agent={workspace.agent}
            threads={workspace.threads}
            activeThreadId={workspace.activeThreadId}
            messages={workspace.messages}
            status={workspace.status}
            activeJob={workspace.activeJob}
            isLoading={workspace.isLoading}
            onSend={workspace.sendMessage}
            onConfirm={workspace.confirmRun}
            onCancel={workspace.cancelRun}
            onStartNewThread={workspace.startNewThread}
            onSelectThread={workspace.selectThread}
            lessonThreadId={lessonThreadId}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={isRestartConfirmOpen}
        onClose={() => setIsRestartConfirmOpen(false)}
        onConfirm={async () => {
          if (!currentProject) return
          try {
            await restartLesson({ projectId: currentProject.id, lessonId })
            setThreadInitialized(false)
            setIsStartingAuto(true)
          } catch (e) {
            console.error(e)
          }
        }}
        title="Restart this lesson?"
        description="This will reset your progress and clear the chat thread for this lesson."
        variant="warning"
        isLoading={isRestarting}
      />
    </div>
  )
}


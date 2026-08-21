"use client"

import { GraduationCap, Play, CheckCircle2, Clock, Lock, Target, Timer, ArrowRight, BrainCircuit, Rocket } from "lucide-react"
import { useProjectContext } from "@/contexts/project-context"
import { useLessons, useStartLesson } from "@/lib/react-query/lessons"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LessonProgressStatus } from "@/lib/api/types"
import Link from "next/link"

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Uncategorized"]

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  A2: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  B1: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  B2: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  C1: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  C2: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  Uncategorized: "bg-gray-500/10 border-gray-500/20 text-gray-400"
}

export default function LessonsPage() {
  const { currentProject } = useProjectContext()
  const router = useRouter()
  
  const { data, isLoading, error } = useLessons(currentProject?.id)
  const { mutateAsync: startLesson, isPending: isStarting } = useStartLesson()

  const handleStartLesson = async (lessonId: string) => {
    if (!currentProject?.id) return
    
    try {
      const response = await startLesson({ 
        projectId: currentProject.id, 
        lessonId 
      })
      router.push(`/lessons/${lessonId}`)
    } catch (err) {
      toast.error("Failed to start lesson")
      console.error(err)
    }
  }

  // Group lessons by CEFR Level and sort by OrderIndex
  const groupedLessons = data?.lessons.reduce((acc, current) => {
    const level = current.lesson.cefrLevel || "Uncategorized"
    if (!acc[level]) {
      acc[level] = []
    }
    acc[level].push(current)
    return acc
  }, {} as Record<string, typeof data.lessons>) || {}

  // Sort lessons within each level
  Object.keys(groupedLessons).forEach(level => {
    groupedLessons[level].sort((a, b) => (a.lesson.orderIndex || 0) - (b.lesson.orderIndex || 0))
  })

  // Build a set of completed lesson IDs for quick lookup
  const completedLessonIds = new Set(
    Object.values(groupedLessons)
      .flat()
      .filter(l => l.progress?.status === LessonProgressStatus.Completed)
      .map(l => l.lesson.id)
  )

  // Determine active levels (those that have lessons) and sort them according to CEFR_LEVELS
  const activeLevels = CEFR_LEVELS.filter(level => groupedLessons[level] && groupedLessons[level].length > 0)

  // Calculate overall progress per level
  const levelProgress = activeLevels.map(level => {
    const lessons = groupedLessons[level]
    const total = lessons.length
    const completed = lessons.filter(l => l.progress?.status === LessonProgressStatus.Completed).length
    const isCompleted = total > 0 && total === completed
    const currentLesson = lessons.find(l => l.progress?.status === LessonProgressStatus.InProgress) || lessons.find(l => l.progress?.status !== LessonProgressStatus.Completed)
    
    return {
      level,
      total,
      completed,
      isCompleted,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      currentLesson
    }
  })

  // Find the current active level (the first one that isn't 100% completed)
  const currentActiveLevelIndex = levelProgress.findIndex(p => !p.isCompleted)
  const activeLevelId = currentActiveLevelIndex >= 0 ? levelProgress[currentActiveLevelIndex].level : null

  // Placement Test logic: If the user has 0 completed lessons across all levels, suggest the test.
  const totalCompletedLessons = levelProgress.reduce((acc, p) => acc + p.completed, 0)
  const showPlacementTest = totalCompletedLessons === 0 && !isLoading && !error && currentProject

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 custom-scroll h-full overflow-y-auto">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-primary/10 mb-6 shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.3)]">
          <GraduationCap className="h-8 w-8 text-brand-primary" />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">Curriculum Map</h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          Follow your structured learning path. Master each level step-by-step with interactive AI sessions and targeted skill practice.
        </p>
        {!showPlacementTest && currentProject && (
          <div className="mt-6">
            <Link 
              href="/lessons/placement" 
              className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-5 py-2.5 rounded-full border border-purple-500/20"
            >
              <BrainCircuit className="h-4 w-4" />
              Retake Placement Test
            </Link>
          </div>
        )}
      </div>

      {!currentProject ? (
        <div className="text-center text-gray-400 mt-12">Please select a project first.</div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 mt-12 bg-red-500/10 p-4 rounded-lg">
          Failed to load curriculum. Please try again.
        </div>
      ) : activeLevels.length === 0 ? (
        <div className="text-center text-gray-400 mt-12">No lessons available yet.</div>
      ) : (
        <>
          {showPlacementTest && (
            <div className="mb-12 relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-brand-background p-1">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 bg-app-surface/50 backdrop-blur-sm rounded-xl">
                <div className="flex items-center mb-6 sm:mb-0 gap-6">
                  <div className="flex items-center justify-center h-16 w-16 shrink-0 rounded-full bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    <BrainCircuit className="h-8 w-8 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Not sure where to start?</h2>
                    <p className="text-gray-400 max-w-md">
                      Take our 5-minute AI Placement Test to determine your CEFR level and instantly unlock lessons matching your skill.
                    </p>
                  </div>
                </div>
                <Link
                  href="/lessons/placement"
                  className="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
                >
                  <Rocket className="h-4 w-4" />
                  Take Placement Test
                </Link>
              </div>
            </div>
          )}

          {/* Roadmap Summary Section */}
          <div className="bg-app-surface/60 border border-white/10 rounded-2xl p-6 md:p-8 mb-16 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Target className="w-5 h-5 mr-2 text-brand-primary" /> 
              Your Learning Roadmap
            </h2>
            <div className="space-y-5">
              {levelProgress.map((p, index) => {
                const colorClass = LEVEL_COLORS[p.level] || LEVEL_COLORS.Uncategorized
                const isLocked = index > (currentActiveLevelIndex === -1 ? levelProgress.length : currentActiveLevelIndex)
                
                return (
                  <div key={p.level} className={`flex flex-col md:flex-row md:items-center gap-4 ${isLocked ? "opacity-50 grayscale" : ""}`}>
                    <div className="w-full md:w-48 flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${p.isCompleted ? "bg-emerald-400" : isLocked ? "border-2 border-gray-500" : "bg-brand-primary shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.8)]"}`} />
                      <span className={`font-bold ${colorClass.split(' ')[2]}`}>{p.level} Level</span>
                      {p.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto md:hidden" />}
                      {isLocked && <Lock className="w-4 h-4 text-gray-500 ml-auto md:hidden" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                        <div 
                          className={`absolute top-0 left-0 h-full transition-all duration-1000 ${p.isCompleted ? "bg-emerald-400" : "bg-brand-primary"}`}
                          style={{ width: `${p.percent}%` }}
                        />
                      </div>
                      {!p.isCompleted && !isLocked && p.currentLesson && (
                        <p className="text-xs text-brand-secondary mt-2 font-medium">
                          Current: {p.currentLesson.lesson.title}
                        </p>
                      )}
                    </div>
                    
                    <div className="w-24 text-right text-sm font-semibold flex items-center justify-end gap-2">
                      <span className="text-gray-300">{p.completed}/{p.total}</span>
                      {p.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400 hidden md:block" />}
                      {isLocked && <Lock className="w-4 h-4 text-gray-500 hidden md:block" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detailed Timeline */}
          <div className="relative border-l-2 border-white/10 ml-4 md:ml-8 py-4">
            {activeLevels.map((level, levelIndex) => {
              const lessons = groupedLessons[level]
              const colorClass = LEVEL_COLORS[level] || LEVEL_COLORS.Uncategorized
              const isLevelLocked = levelIndex > (currentActiveLevelIndex === -1 ? activeLevels.length : currentActiveLevelIndex)
              
              return (
                <div key={level} className={`mb-16 relative ${isLevelLocked ? "opacity-40" : ""}`}>
                {/* Level Header Node */}
                <div className="absolute -left-[25px] top-0 h-12 w-12 rounded-full border-4 border-app-bg bg-app-surface flex items-center justify-center shadow-lg shadow-black/50 z-10">
                  <span className={`text-sm font-bold ${colorClass.split(' ')[2]}`}>{level}</span>
                </div>
                
                <div className="pl-12 pt-2 mb-8">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Level {level}</h2>
                  <p className="text-gray-400 text-sm mt-1">Master the fundamentals and progress your skills.</p>
                </div>

                <div className="space-y-6 pl-8 md:pl-12">
                  {lessons.map(({ lesson, progress }, index) => {
                    const isCompleted = progress?.status === LessonProgressStatus.Completed
                    const isInProgress = progress?.status === LessonProgressStatus.InProgress
                    
                    // Unlock logic:
                    // 1. If lesson has an explicit UnlocksAfterLessonId — check that prerequisite is completed.
                    // 2. Otherwise apply linear progression: lesson at position N is locked unless N-1 is completed.
                    let isLocked = false
                    if (lesson.unlocksAfterLessonId) {
                      isLocked = !completedLessonIds.has(lesson.unlocksAfterLessonId)
                    } else if (index > 0) {
                      const prevLesson = lessons[index - 1]
                      isLocked = prevLesson.progress?.status !== LessonProgressStatus.Completed
                    }

                    return (
                      <div key={lesson.id} className="relative group">
                        {/* Connection line to next item (if not last) */}
                        {index < lessons.length - 1 && (
                          <div className="absolute left-[-29px] md:left-[-45px] top-10 bottom-[-24px] w-0.5 bg-white/5" />
                        )}

                        {/* Lesson Node Dot */}
                        <div className={`absolute left-[-33px] md:left-[-49px] top-6 h-3 w-3 rounded-full border-2 border-app-bg z-10 transition-colors duration-300
                          ${isCompleted ? "bg-emerald-400" : isInProgress ? "bg-amber-400" : "bg-white/20"}`} 
                        />

                        <div
                          onClick={() => !isLocked && handleStartLesson(lesson.id)}
                          className={`relative flex flex-col rounded-2xl border border-white/10 bg-app-surface/40 p-6 transition-all duration-300 overflow-hidden
                            ${isLocked ? "opacity-60 cursor-not-allowed grayscale" : "cursor-pointer hover:bg-app-surface/80 hover:border-white/30 hover:shadow-xl hover:shadow-brand-primary/5 hover:-translate-y-1"}
                            ${isStarting ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 ease-out" />
                          
                          <div className="relative z-10">
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${colorClass}`}>
                                  Part {lesson.orderIndex || index + 1}
                                </span>
                                
                                {lesson.targetSkills && (
                                  <div className="flex gap-1">
                                    {lesson.targetSkills.split(',').map(skill => (
                                      <span key={skill} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300" title={`Skill: ${skill.trim()}`}>
                                        {skill.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {lesson.estimatedMinutes > 0 && (
                                  <div className="flex items-center text-gray-400 text-xs font-medium">
                                    <Timer className="h-3.5 w-3.5 mr-1" />
                                    {lesson.estimatedMinutes} min
                                  </div>
                                )}
                                
                                {isLocked ? (
                                  <div className="flex items-center text-gray-500 text-sm font-medium">
                                    <Lock className="h-4 w-4 mr-1" /> Locked
                                  </div>
                                ) : isCompleted ? (
                                  <div className="flex items-center text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded-md">
                                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Completed
                                  </div>
                                ) : isInProgress ? (
                                  <div className="flex items-center text-amber-400 text-sm font-medium bg-amber-400/10 px-2 py-1 rounded-md">
                                    <Clock className="h-4 w-4 mr-1.5" /> In Progress
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{lesson.title}</h3>
                            <p className="text-gray-400 text-sm line-clamp-2 pr-12">
                              {lesson.description}
                            </p>
                          </div>

                          {!isLocked && (
                            <div className="relative z-10 mt-5 flex items-center text-brand-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                              {isCompleted ? "Review Session" : isInProgress ? "Continue Session" : "Start Session"} 
                              <Play className="ml-1.5 h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        </>
      )}
    </div>
  )
}

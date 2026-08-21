"use client"

import { useEffect, useState, useMemo } from "react"
import { useProjects, useProject, useUpdateProject } from "@/lib/react-query"
import type { ProjectResponseDto, TtsSettingsDto, UpdateProjectDto } from "@/lib/api/types"
import { useBrowserTts, getBcp47LangTag } from "@/hooks/use-browser-tts"
import { Volume2 } from "lucide-react"

export function ProfileStudioTtsSection() {
  const { data: projects, isLoading: projectsLoading } = useProjects(false)
  const [projectId, setProjectId] = useState("")
  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const updateProject = useUpdateProject()

  const [voiceName, setVoiceName] = useState<string>("")
  const [rate, setRate] = useState<number>(1.0)
  const [pitch, setPitch] = useState<number>(1.0)
  const [feedback, setFeedback] = useState<string | null>(null)

  const currentTtsSettings = useMemo<TtsSettingsDto>(
    () => ({
      voiceName: voiceName || null,
      rate,
      pitch,
    }),
    [voiceName, rate, pitch]
  )

  const { speak, availableVoices } = useBrowserTts({
    targetLang: project?.targetLang,
    ttsSettings: currentTtsSettings,
  })

  useEffect(() => {
    if (!projects?.length) {
      setProjectId("")
      return
    }
    setProjectId((current) => {
      if (current && projects.some((p) => p.id === current)) return current
      return projects[0].id
    })
  }, [projects])

  useEffect(() => {
    if (!project) return
    setVoiceName(project.ttsSettings?.voiceName ?? "")
    setRate(project.ttsSettings?.rate ?? 1.0)
    setPitch(project.ttsSettings?.pitch ?? 1.0)
  }, [project?.id, project?.ttsSettings])

  const targetBcp47 = useMemo(() => getBcp47LangTag(project?.targetLang), [project?.targetLang])
  const langPrefix = useMemo(() => targetBcp47.split("-")[0].toLowerCase(), [targetBcp47])

  const filteredVoices = useMemo(() => {
    if (!availableVoices.length) return []
    const matching = availableVoices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix))
    return matching.length > 0 ? matching : availableVoices
  }, [availableVoices, langPrefix])

  const handleSave = async () => {
    if (!project) return
    const newSettings: TtsSettingsDto = {
      voiceName: voiceName.trim() || null,
      rate,
      pitch,
    }
    const data: UpdateProjectDto = { ttsSettings: newSettings }
    await updateProject.mutateAsync({ id: project.id, data })
    setFeedback("TTS settings saved for project!")
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleTest = () => {
    const sampleText =
      project?.targetLang === "ru" || project?.targetLang === "russian"
        ? "Привет! Это проверка голоса синтеза речи."
        : project?.targetLang === "ko" || project?.targetLang === "korean"
        ? "안녕하세요! 음성 합성 테스트입니다."
        : project?.targetLang === "es" || project?.targetLang === "spanish"
        ? "¡Hola! Esta es una prueba de síntesis de voz."
        : "Hello! This is a text to speech test."
    speak(sampleText)
  }

  if (projectsLoading) {
    return (
      <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8">
        <p className="text-sm text-gray-500">Loading projects…</p>
      </section>
    )
  }

  if (!projects?.length) {
    return (
      <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-white mb-1">Browser TTS Voice (per project)</h2>
        <p className="text-sm text-gray-500 mt-2">
          Create a language project first to configure TTS voices.
        </p>
      </section>
    )
  }

  return (
    <section className="glass-panel border border-app-border rounded-[2rem] p-6 sm:p-8 h-fit">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Browser TTS Voice (per project)</h2>
          <p className="text-sm text-gray-500">
            Select preferred browser voice, speech rate, and pitch for each study project.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/50 transition"
            aria-label="Select project for TTS settings"
          >
            {projects.map((p: ProjectResponseDto) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.sourceLang.toUpperCase()} → {p.targetLang.toUpperCase()})
                {p.isArchived ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </div>

        {projectLoading && projectId && <p className="text-sm text-gray-500">Loading project…</p>}

        {project && !projectLoading && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Voice ({project.targetLang.toUpperCase()} voices)
              </label>
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full px-3 py-2 border border-white/10 rounded-lg bg-app-bg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple transition"
                aria-label="Browser TTS voice selection"
              >
                <option value="">-- Default for {targetBcp47} --</option>
                {filteredVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Speed (Rate): {rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-brand-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Pitch: {pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-brand-purple"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTest}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4 text-brand-purple" />
                Test Voice
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={updateProject.isPending}
                className="px-4 py-1.5 bg-brand-purple hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition"
              >
                {updateProject.isPending ? "Saving…" : "Save TTS Settings"}
              </button>

              {feedback && <p className="text-xs text-emerald-400">{feedback}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

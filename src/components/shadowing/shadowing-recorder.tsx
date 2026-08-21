"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ShadowingAudioRecorder, playAudio, type RecordingResult } from "@/lib/shadowing/shadowing-audio"
import { cn } from "@/lib/utils"

interface ShadowingRecorderProps {
  ttsUrl?: string | null
  onRecordingChange?: (recording: RecordingResult | null) => void
  disabled?: boolean
}

export function ShadowingRecorder({ ttsUrl, onRecordingChange, disabled }: ShadowingRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<RecordingResult | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isPlayingTts, setIsPlayingTts] = useState(false)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const recorderRef = useRef(new ShadowingAudioRecorder())
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      ttsAudioRef.current?.pause()
      voiceAudioRef.current?.pause()
      if (recording?.url) {
        URL.revokeObjectURL(recording.url)
      }
    }
  }, [recording])

  const handlePlayTts = useCallback(() => {
    if (!ttsUrl || isPlayingTts) return
    setIsPlayingTts(true)
    const audio = playAudio(ttsUrl)
    ttsAudioRef.current = audio
    audio.onended = () => setIsPlayingTts(false)
    audio.onerror = () => setIsPlayingTts(false)
  }, [ttsUrl, isPlayingTts])

  const handleStartRecording = useCallback(async () => {
    const recorder = recorderRef.current
    const ok = await recorder.requestPermission()
    if (!ok) {
      setPermissionDenied(true)
      return
    }
    setPermissionDenied(false)
    if (recording?.url) {
      URL.revokeObjectURL(recording.url)
    }
    setRecording(null)
    const started = recorder.start()
    if (started) {
      setIsRecording(true)
    }
  }, [recording])

  const handleStopRecording = useCallback(async () => {
    const recorder = recorderRef.current
    setIsRecording(false)
    const result = await recorder.stop()
    if (result) {
      setRecording(result)
      onRecordingChange?.(result)
    }
  }, [onRecordingChange])

  const handlePlayVoice = useCallback(() => {
    if (!recording || isPlayingVoice) return
    setIsPlayingVoice(true)
    const audio = playAudio(recording.url)
    voiceAudioRef.current = audio
    audio.onended = () => setIsPlayingVoice(false)
    audio.onerror = () => setIsPlayingVoice(false)
  }, [recording, isPlayingVoice])

  const handlePlayBoth = useCallback(() => {
    if (!ttsUrl || !recording) return
    setIsPlayingTts(true)
    const ttsAudio = playAudio(ttsUrl)
    ttsAudioRef.current = ttsAudio
    ttsAudio.onended = () => {
      setIsPlayingTts(false)
      setIsPlayingVoice(true)
      const voiceAudio = playAudio(recording.url)
      voiceAudioRef.current = voiceAudio
      voiceAudio.onended = () => setIsPlayingVoice(false)
      voiceAudio.onerror = () => setIsPlayingVoice(false)
    }
    ttsAudio.onerror = () => setIsPlayingTts(false)
  }, [ttsUrl, recording])

  return (
    <div className={cn("space-y-4", disabled && "opacity-60 pointer-events-none")}>
      {permissionDenied && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-200">
          Microphone access was denied. Please allow microphone access in your browser to record shadowing.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePlayTts}
          disabled={!ttsUrl || isPlayingTts || isRecording}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition",
            isPlayingTts
              ? "bg-brand-primary text-white"
              : "bg-app-surface border border-app-border text-white hover:bg-app-hover"
          )}
        >
          <i className={cn("fas", isPlayingTts ? "fa-volume-up" : "fa-play")} />
          {isPlayingTts ? "Playing native…" : "Play native"}
        </button>

        {!isRecording ? (
          <button
            type="button"
            onClick={handleStartRecording}
            disabled={isPlayingTts || isPlayingVoice}
            className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 px-5 py-3 text-sm font-semibold hover:bg-rose-500/25 transition"
          >
            <i className="fas fa-microphone" />
            Record myself
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopRecording}
            className="flex items-center gap-2 rounded-xl bg-rose-500 text-white px-5 py-3 text-sm font-semibold hover:bg-rose-600 transition animate-pulse"
          >
            <i className="fas fa-stop" />
            Stop recording
          </button>
        )}

        {recording && (
          <>
            <button
              type="button"
              onClick={handlePlayVoice}
              disabled={isPlayingVoice || isRecording}
              className={cn(
                "flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition",
                isPlayingVoice
                  ? "bg-brand-primary text-white"
                  : "bg-app-surface border border-app-border text-white hover:bg-app-hover"
              )}
            >
              <i className={cn("fas", isPlayingVoice ? "fa-volume-up" : "fa-play")} />
              {isPlayingVoice ? "Playing me…" : "Play me"}
            </button>

            <button
              type="button"
              onClick={handlePlayBoth}
              disabled={isPlayingTts || isPlayingVoice || isRecording}
              className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-5 py-3 text-sm font-semibold hover:bg-emerald-500/25 transition"
            >
              <i className="fas fa-headphones" />
              Play both
            </button>
          </>
        )}
      </div>

      {recording && (
        <p className="text-xs text-gray-500">
          Recording: {Math.round(recording.durationMs / 1000)}s ·{" "}
          {(recording.blob.size / 1024).toFixed(1)} KB
        </p>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Bot, History, Plus, Sparkles, Trash2, Volume2, VolumeX } from "lucide-react"
import { AgentChatThread } from "@/components/dashboard/agent-chat/agent-chat-thread"
import { AgentComposer } from "@/components/dashboard/agent-chat/agent-composer"
import { POLYGUIDE_BRAND, POLYGUIDE_DASHBOARD_TAGLINE } from "@/lib/agent/polyguide-brand"
import { cn } from "@/lib/utils"
import type { AgentActionCard, AgentMessage } from "@/lib/agent/agent-message"
import type { AgentThreadListItemDto } from "@/lib/api/types"
import { useOptionalProjectContext } from "@/contexts/project-context"
import { getBcp47LangTag } from "@/hooks/use-browser-tts"

interface AgentChatPanelProps {
  threads: AgentThreadListItemDto[]
  activeThreadId: string | null
  messages: AgentMessage[]
  isLoading: boolean
  isSyncing: boolean
  aiAvailable: boolean
  aiHint: string | null
  syncBannerMessage: string | null
  onSend: (text: string) => void
  onAction: (action: AgentActionCard) => void
  onSuggestedPrompt: (prompt: string) => void
  onClearThread: () => void
  onSelectThread: (id: string) => void
  onStartNewThread: () => void
}

export function AgentChatPanel({
  threads,
  activeThreadId,
  messages,
  isLoading,
  isSyncing,
  aiAvailable,
  aiHint,
  syncBannerMessage,
  onSend,
  onAction,
  onSuggestedPrompt,
  onClearThread,
  onSelectThread,
  onStartNewThread,
}: AgentChatPanelProps) {
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const lastSpokenMessageIdRef = useRef<string | null>(null)
  const projectContext = useOptionalProjectContext()
  const currentProject = projectContext?.currentProject

  useEffect(() => {
    if (!isVoiceMode || messages.length === 0) return
    const lastMessage = messages[messages.length - 1]
    
    // If the last message is from the assistant and hasn't been spoken yet
    if (lastMessage.role !== "user" && lastMessage.id !== lastSpokenMessageIdRef.current && lastMessage.content) {
      // Very basic markdown strip for TTS
      const cleanText = lastMessage.content.replace(/[*#_`\[\]()]/g, '').trim()
      if (cleanText && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel() // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.lang = getBcp47LangTag(currentProject?.targetLang)
        const tts = currentProject?.ttsSettings
        utterance.rate = tts?.rate ?? 1.0
        utterance.pitch = tts?.pitch ?? 1.0
        if (tts?.voiceName) {
          const voices = window.speechSynthesis.getVoices()
          const match = voices.find((v) => v.name === tts.voiceName)
          if (match) utterance.voice = match
        }
        window.speechSynthesis.speak(utterance)
      }
      lastSpokenMessageIdRef.current = lastMessage.id
    }
  }, [messages, isVoiceMode, currentProject])

  return (
    <section
      data-testid="agent-command-center"
      className="glass-panel border border-app-border rounded-3xl overflow-hidden flex flex-col min-h-[min(720px,calc(100vh-16rem))] shadow-[0_0_60px_rgba(139,92,246,0.06)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-app-border bg-gradient-to-r from-brand-primary/10 via-app-surface/90 to-brand-secondary/5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-primary/35 to-brand-secondary/35 border border-brand-primary/30 flex items-center justify-center shrink-0 shadow-glow">
            <Bot className="h-6 w-6 text-brand-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {POLYGUIDE_BRAND}
              <Sparkles className="h-4 w-4 text-brand-primary" />
            </h2>
            <p className="text-sm text-gray-400 truncate">
              {aiAvailable ? POLYGUIDE_DASHBOARD_TAGLINE : aiHint ?? "AI offline — navigation and progress still work."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {threads.length > 0 && (
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                <History className="h-3.5 w-3.5" />
                History
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-app-surface shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-20">
                <div className="max-h-64 overflow-y-auto custom-scroll p-1.5">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => onSelectThread(thread.id)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2 text-xs transition",
                        activeThreadId === thread.id
                          ? "bg-brand-primary/15 text-white"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <div className="font-medium truncate">{thread.title || "Chat"}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(thread.updatedAt).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition",
              isVoiceMode
                ? "bg-brand-primary/20 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/30"
                : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
            )}
            title={isVoiceMode ? "Voice mode enabled" : "Voice mode disabled"}
          >
            {isVoiceMode ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Voice Mode</span>
          </button>

          <button
            type="button"
            data-testid="agent-new-chat-button"
            onClick={onStartNewThread}
            disabled={isLoading || isSyncing}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            New chat
          </button>

          {activeThreadId && (
            <button
              type="button"
              onClick={onClearThread}
              disabled={isLoading || isSyncing}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-rose-200 hover:bg-rose-500/10 hover:border-rose-500/30 transition disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {syncBannerMessage && (
        <div
          role="status"
          data-testid="agent-sync-banner"
          className="mx-6 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
        >
          {syncBannerMessage}
        </div>
      )}

      <AgentChatThread
        messages={messages}
        isLoading={isLoading || isSyncing}
        onAction={onAction}
        onSuggestedPrompt={onSuggestedPrompt}
      />

      <div className="border-t border-app-border px-6 py-5 bg-app-bg/50 backdrop-blur-sm">
        <AgentComposer disabled={isLoading || isSyncing} onSend={onSend} />
      </div>
    </section>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { DailyGoals } from "@/components/dashboard/daily-goals"
import { DashboardProgressSection } from "@/components/dashboard/dashboard-progress-section"
import { RecentDecks } from "@/components/dashboard/recent-decks"
import { AgentChatPanel } from "@/components/dashboard/agent-chat/agent-chat-panel"
import { applyAgentActionNavigation } from "@/lib/agent/agent-tool-registry"
import { useAgentChat } from "@/lib/agent/use-agent-chat"
import type { AgentActionCard } from "@/lib/agent/agent-message"

export function AgentDashboardShell() {
  const router = useRouter()
  const {
    threads,
    activeThreadId,
    messages,
    isLoading,
    isSyncing,
    syncBannerMessage,
    sendMessage,
    clearThread,
    selectThread,
    startNewThread,
    aiAvailable,
    aiHint,
  } = useAgentChat()

  const handleAction = (action: AgentActionCard) => {
    applyAgentActionNavigation(action)
    router.push(action.href)
  }

  return (
    <div className="max-w-7xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
      <AgentChatPanel
        threads={threads}
        activeThreadId={activeThreadId}
        messages={messages}
        isLoading={isLoading}
        isSyncing={isSyncing}
        aiAvailable={aiAvailable}
        aiHint={aiHint}
        syncBannerMessage={syncBannerMessage}
        onSend={sendMessage}
        onAction={handleAction}
        onSuggestedPrompt={sendMessage}
        onClearThread={clearThread}
        onSelectThread={selectThread}
        onStartNewThread={startNewThread}
      />

      <div data-testid="dashboard-stats-below" className="space-y-12 pb-4">
        <DailyGoals />
        <RecentDecks />
        <DashboardProgressSection />
      </div>
    </div>
  )
}

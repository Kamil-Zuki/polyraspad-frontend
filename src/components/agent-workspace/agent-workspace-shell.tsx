"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { History, Plus, Trash2 } from "lucide-react"
import { AgentChatThread } from "@/components/dashboard/agent-chat/agent-chat-thread"
import { AgentComposer } from "@/components/dashboard/agent-chat/agent-composer"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { AgentActionCard, AgentMessage } from "@/lib/agent/agent-message"
import type { AgentDefinition } from "@/lib/agent/agent-catalog"
import type { AutomationJobDto, AgentThreadListItemDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface AgentWorkspaceShellProps {
  agent: AgentDefinition
  threads: AgentThreadListItemDto[]
  activeThreadId: string | null
  messages: AgentMessage[]
  status: string
  activeJob?: AutomationJobDto | null
  isLoading: boolean
  onSend: (text: string) => void
  onConfirm: (parameters: Record<string, unknown>) => void
  onCancel: () => void
  onStartNewThread: () => void
  onSelectThread: (id: string) => void
  onDeleteThread?: (id: string) => void
  /** When set, hides the global Recent Chats list and scopes the panel to just this lesson thread */
  lessonThreadId?: string | null
}

export function AgentWorkspaceShell({
  agent,
  threads,
  activeThreadId,
  messages,
  status,
  activeJob,
  isLoading,
  onSend,
  onConfirm,
  onCancel,
  onStartNewThread,
  onSelectThread,
  onDeleteThread,
  lessonThreadId,
}: AgentWorkspaceShellProps) {
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null)
  const visibleThreads = lessonThreadId
    ? threads.filter((t) => t.id === lessonThreadId)
    : threads
  const router = useRouter()
  const Icon = agent.icon

  const handleAction = (action: AgentActionCard) => {
    if (action.href) router.push(action.href)
  }

  const composerDisabled = isLoading || status === "running"
  const isEmpty = messages.length === 0

  return (
    <section className="glass-panel border-0 md:border md:border-app-border rounded-none md:rounded-3xl overflow-hidden flex flex-col h-full shadow-none md:shadow-[0_0_60px_rgba(139,92,246,0.06)] bg-app-bg relative">
      
      {!isEmpty && (
        <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-10 pointer-events-none">
          <div className="flex items-center gap-3">
             <div
              className="h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 shadow-glow"
              style={{
                backgroundColor: `${agent.themeColor}20`,
                borderColor: `${agent.themeColor}40`,
                color: agent.themeColor,
              }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-white/50">{agent.name}</span>
          </div>
          {lessonThreadId === undefined && (
            <button
              type="button"
              onClick={onStartNewThread}
              disabled={isLoading}
              className="pointer-events-auto rounded-full bg-white/5 hover:bg-white/10 p-2 text-gray-400 hover:text-white transition"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 mt-[-5%] max-w-3xl mx-auto w-full">
          <div
            className="h-24 w-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: agent.themeColor, color: "#fff" }}
          >
            <Icon className="h-10 w-10" />
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-3">{agent.name}</h2>
          <p className="text-gray-400 text-center text-base mb-10 max-w-2xl">
            {agent.longDescription}
          </p>

          <div className="w-full relative z-10 mb-8">
            <AgentComposer
              disabled={composerDisabled}
              placeholder={`Ask ${agent.name}...`}
              onSend={onSend}
            />
          </div>

          {lessonThreadId === undefined && visibleThreads.length > 0 && (
             <div className="w-full flex flex-col">
               <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2 px-3">
                 <div className="flex items-center gap-2">
                   Recent chats
                 </div>
                 <div className="flex items-center gap-4 mr-2">
                   <span>Insights ↗</span>
                 </div>
               </div>
               <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scroll pr-1 -mr-1">
                   {visibleThreads.map((thread) => (
                     <div
                       key={thread.id}
                       onClick={() => onSelectThread(thread.id)}
                       className={cn(
                         "group flex items-center justify-between w-full rounded-lg px-3 py-2.5 hover:bg-white/5 transition text-left cursor-pointer",
                         activeThreadId === thread.id && "bg-white/5"
                       )}
                     >
                       <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                         <History className="h-4 w-4 text-gray-500 shrink-0 group-hover:text-gray-300 transition" />
                         <span className="font-medium text-gray-300 text-sm truncate">{thread.title || "Chat"}</span>
                         <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400 shrink-0">{agent.name}</span>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                         <span className="text-xs text-gray-500">
                           {new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                             Math.ceil((new Date(thread.updatedAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                             'day'
                           ).replace('this day', 'today').replace('1 day ago', '1d').replace(/(\d+)\s+days?\s+ago/, '$1d')}
                         </span>
                         {onDeleteThread && (
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation()
                               setDeletingThreadId(thread.id)
                             }}
                             className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                             title="Delete Chat"
                           >
                             <Trash2 className="h-3.5 w-3.5" />
                           </button>
                         )}
                       </div>
                     </div>
                   ))}
               </div>
             </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-hidden pt-14 flex flex-col">
            <AgentChatThread
              messages={messages}
              isLoading={isLoading && status !== "running"}
              activeJob={activeJob}
              onAction={handleAction}
              onConfirm={onConfirm}
              onCancel={onCancel}
              onSuggestedPrompt={onSend}
            />
          </div>
          
          <div className="px-4 py-4 md:px-8 md:py-6 bg-gradient-to-t from-app-bg via-app-bg to-transparent">
             <div className="max-w-4xl mx-auto rounded-2xl shadow-2xl">
              <AgentComposer
                disabled={composerDisabled}
                placeholder={`Message ${agent.name}...`}
                onSend={onSend}
              />
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingThreadId)}
        onClose={() => setDeletingThreadId(null)}
        onConfirm={() => {
          if (deletingThreadId && onDeleteThread) {
            onDeleteThread(deletingThreadId)
            setDeletingThreadId(null)
          }
        }}
        title="Delete this chat?"
        description="This chat history will be permanently deleted."
        variant="destructive"
      />
    </section>
  )
}

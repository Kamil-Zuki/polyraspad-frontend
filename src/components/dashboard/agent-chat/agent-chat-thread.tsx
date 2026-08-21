"use client"

import { useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion } from "framer-motion"
import { Bot, User } from "lucide-react"
import { AgentActionCardView } from "@/components/dashboard/agent-chat/agent-action-card"
import { AgentClarificationCard } from "@/components/agent-workspace/agent-clarification-card"
import { AgentExecutionCard } from "@/components/agent-workspace/agent-execution-card"
import { AgentResultCard } from "@/components/agent-workspace/agent-result-card"
import { AGENT_SUGGESTED_PROMPTS } from "@/lib/agent/agent-prompts"
import type { AgentActionCard, AgentMessage } from "@/lib/agent/agent-message"
import type { AutomationJobDto } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface AgentChatThreadProps {
  messages: AgentMessage[]
  isLoading: boolean
  activeJob?: AutomationJobDto | null
  emptyStateTitle?: string
  emptyStateSubtitle?: string
  onAction: (action: AgentActionCard) => void
  onConfirm?: (parameters: Record<string, unknown>) => void
  onCancel?: () => void
  onSuggestedPrompt?: (prompt: string) => void
}

export function AgentChatThread({
  messages,
  isLoading,
  activeJob,
  emptyStateTitle,
  emptyStateSubtitle,
  onAction,
  onConfirm,
  onCancel,
  onSuggestedPrompt,
}: AgentChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" })
  }, [messages, isLoading])

  const hasStreamingMessage = messages.some(m => m.isStreaming)

  return (
    <div className="flex-1 overflow-y-auto custom-scroll px-6 py-6 space-y-5">
      {messages.length === 0 ? (
        <div
          data-testid="agent-empty-state"
          className="h-full min-h-[380px] flex flex-col items-center justify-center text-center px-8 py-10"
        >
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/10 border border-brand-primary/25 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
            <Bot className="h-10 w-10 text-brand-primary" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
            {emptyStateTitle ?? "What do you want to learn today?"}
          </h3>
          <p className="text-base text-gray-400 max-w-xl leading-relaxed mb-6">
            {emptyStateSubtitle ??
              "Start with a question below — explain a word, check your progress, draft a card, or jump into Reader, Study, and Vocabulary."}
          </p>

          {onSuggestedPrompt && (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
              {AGENT_SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSuggestedPrompt(p.prompt)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        messages.map((message) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={message.id}
            className={cn(
              "flex gap-3 max-w-4xl",
              message.role === "user" ? "justify-end ml-auto" : "justify-start mr-auto",
            )}
          >
            {message.role !== "user" && (
              <div className="h-9 w-9 rounded-xl bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-4 w-4 text-brand-primary" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm",
                message.role === "user"
                  ? "bg-brand-primary text-white shadow-glow whitespace-pre-wrap rounded-tr-sm"
                  : message.refusal
                    ? "bg-amber-500/10 border border-amber-500/25 text-amber-50 rounded-tl-sm"
                    : message.isError
                      ? "bg-rose-500/10 border border-rose-500/20 text-rose-100 rounded-tl-sm"
                      : "bg-[#252525] border border-white/5 text-gray-100 rounded-tl-sm",
              )}
            >
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mb-3 space-y-1.5 border-l-2 border-white/10 pl-3">
                  {message.toolCalls.map((tc, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[13px] text-gray-400 font-medium">
                       <span className="text-brand-primary/80">›</span>
                       <span>
                         {tc.status === "pending" ? (
                           <span className="animate-pulse">Thinking: {tc.name}...</span>
                         ) : tc.status === "error" ? (
                           <span className="text-rose-400">Failed: {tc.name}</span>
                         ) : (
                           <span>Used <span className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded-md">{tc.name}</span></span>
                         )}
                       </span>
                    </div>
                  ))}
                </div>
              )}

              {message.role === "user" ? (
                message.content
              ) : (
                <div className="prose prose-invert max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-a:text-brand-primary hover:prose-a:text-brand-primary/80 prose-headings:text-white prose-strong:text-white/95 prose-headings:my-2 text-[15px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content.replace(/\n{3,}/g, '\n\n')}
                  </ReactMarkdown>
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-brand-primary animate-pulse align-middle" />
                  )}
                </div>
              )}

              {message.clarification && onConfirm && (
                <AgentClarificationCard
                  clarification={message.clarification}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                />
              )}

              {message.execution && (
                <AgentExecutionCard job={activeJob} execution={message.execution} />
              )}

              {message.actions && message.actions.length > 0 && (
                <AgentResultCard actions={message.actions} onAction={onAction} />
              )}

              {message.suggestedPrompts && message.suggestedPrompts.length > 0 && onSuggestedPrompt && (
                <div
                  data-testid="agent-refusal-suggestions"
                  className="mt-3 flex flex-wrap gap-2"
                >
                  {message.suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onSuggestedPrompt(prompt)}
                      className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/20 transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {message.role === "user" && (
              <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                <User className="h-4 w-4 text-gray-300" />
              </div>
            )}
          </motion.div>
        ))
      )}

      {isLoading && !hasStreamingMessage && (
        <div className="flex gap-3 justify-start max-w-4xl">
          <div className="h-9 w-9 rounded-xl bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4 text-brand-primary animate-pulse" />
          </div>
          <div className="rounded-2xl px-4 py-3 bg-app-surface border border-app-border text-sm text-gray-500">
            Thinking...
          </div>
        </div>
      )}
      <div ref={bottomRef} className="h-px w-full" />
    </div>
  )
}

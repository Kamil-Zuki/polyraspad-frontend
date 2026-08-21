import type { AgentDomainCategory } from "@/lib/agent/agent-domain-policy"
import type { AgentMessageDto, AgentMessageInputDto } from "@/lib/api/types"

export type AgentMessageRole = "user" | "assistant" | "system"

export type AgentActionKind =
  | "navigate"
  | "open_editor_draft"
  | "start_study"
  | "view_vocabulary"

export interface AgentActionCard {
  id: string
  title: string
  description?: string
  kind: AgentActionKind
  href: string
  label: string
  /** Optional card field patch applied when opening editor draft. */
  editorDraft?: Record<string, string>
}

export interface AgentClarificationMetadata {
  agentId: string
  type: "confirm" | "question"
  parameters: Record<string, unknown>
  question?: string
}

export interface AgentExecutionMetadata {
  agentId: string
  jobId: string
  status: string
  progressPercent: number
  logs: string[]
}

export interface AgentResultMetadata {
  agentId: string
  jobId: string
  result: Record<string, unknown> | null
}

export interface AgentMessage {
  id: string
  role: AgentMessageRole
  content: string
  createdAt: number
  actions?: AgentActionCard[]
  isError?: boolean
  intentCategory?: AgentDomainCategory
  refusal?: boolean
  suggestedPrompts?: string[]
  clarification?: AgentClarificationMetadata
  execution?: AgentExecutionMetadata
  result?: AgentResultMetadata
  toolCalls?: AgentToolCallMetadata[]
  displayContent?: string
  isStreaming?: boolean
}

export function createAgentMessage(
  role: AgentMessageRole,
  content: string,
  extras?: Pick<
    AgentMessage,
    | "actions"
    | "isError"
    | "intentCategory"
    | "refusal"
    | "suggestedPrompts"
    | "clarification"
    | "execution"
    | "result"
    | "toolCalls"
    | "displayContent"
    | "isStreaming"
  > & { id?: string },
): AgentMessage {
  return {
    id: extras?.id ?? `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: Date.now(),
    ...extras,
  }
}

export interface AgentToolCallMetadata {
  name: string
  status: "pending" | "success" | "error"
  result?: string
}

export interface AgentMessageMetadata {
  actions?: AgentActionCard[]
  isError?: boolean
  intentCategory?: AgentDomainCategory
  refusal?: boolean
  suggestedPrompts?: string[]
  clarification?: AgentClarificationMetadata
  execution?: AgentExecutionMetadata
  result?: AgentResultMetadata
  toolCalls?: AgentToolCallMetadata[]
  /** When set, overrides the raw content for display (used for agent title prefixes). */
  displayContent?: string
}

export function serializeAgentMessageMetadata(
  message: Pick<AgentMessage, keyof AgentMessageMetadata>,
): string | undefined {
  const metadata: AgentMessageMetadata = {}
  if (message.actions?.length) metadata.actions = message.actions
  if (message.isError) metadata.isError = true
  if (message.intentCategory) metadata.intentCategory = message.intentCategory
  if (message.refusal) metadata.refusal = true
  if (message.suggestedPrompts?.length) metadata.suggestedPrompts = message.suggestedPrompts
  if (message.clarification) metadata.clarification = message.clarification
  if (message.execution) metadata.execution = message.execution
  if (message.result) metadata.result = message.result
  if (message.toolCalls?.length) metadata.toolCalls = message.toolCalls
  if (message.displayContent) metadata.displayContent = message.displayContent
  return Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : undefined
}

export function parseAgentMessageMetadata(metadataJson?: string | null): AgentMessageMetadata {
  if (!metadataJson?.trim()) return {}
  try {
    const parsed = JSON.parse(metadataJson) as AgentMessageMetadata
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function toAgentMessageInput(message: AgentMessage): AgentMessageInputDto {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    metadataJson: serializeAgentMessageMetadata(message),
  }
}

export function agentMessageFromDto(dto: AgentMessageDto): AgentMessage {
  const metadata = parseAgentMessageMetadata(dto.metadataJson)
  return {
    id: dto.id,
    role: dto.role as AgentMessageRole,
    content: metadata.displayContent ?? dto.content,
    createdAt: new Date(dto.createdAt).getTime(),
    ...metadata,
  }
}

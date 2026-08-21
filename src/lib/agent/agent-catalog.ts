import { BrainCircuit } from "lucide-react"
import type { AgentActionCard } from "./agent-message"

export interface AgentResultAction {
  id: string
  title: string
  description?: string
  href: string
  label: string
  condition?: (result: Record<string, unknown> | null) => boolean
}

export interface AgentDefinition {
  id: string
  name: string
  description: string
  longDescription: string
  icon: typeof BrainCircuit
  themeColor: string
  jobType: string
  defaultPayload: Record<string, unknown>
  examplePrompts: string[]
  resultActions: AgentResultAction[]
}

export const AGENTS: AgentDefinition[] = [
  {
    id: "study-copilot",
    name: "Study Copilot",
    description: "Your personal AI tutor that knows your vocabulary and progress.",
    longDescription:
      "Study Copilot analyzes your vocabulary, suggests what to focus on, asks clarifying questions, and helps you optimize your language learning.",
    icon: BrainCircuit,
    themeColor: "#3B82F6",
    jobType: "study-copilot",
    defaultPayload: {},
    examplePrompts: [
      "How many words do I know?",
      "What should I study today?",
      "Help me understand this grammar rule",
    ],
    resultActions: [],
  },
  {
    id: "placement-copilot",
    name: "Placement Test AI",
    description: "Diagnoses your CEFR level and unlocks curriculum.",
    longDescription:
      "This agent acts as an experienced language teacher. It asks you a series of progressive questions to determine your CEFR level (A1-C2) and automatically unlocks lessons appropriate for your skill level.",
    icon: BrainCircuit,
    themeColor: "#8B5CF6", // Purple
    jobType: "placement-copilot",
    defaultPayload: {},
    examplePrompts: [],
    resultActions: [
      {
        id: "return-to-lessons",
        title: "Test Completed",
        description: "Your CEFR level has been set.",
        label: "Return to Curriculum",
        href: "/lessons",
      }
    ],
  },
]

export function getAgentById(id: string): AgentDefinition | undefined {
  return AGENTS.find((agent) => agent.id === id)
}

export function listAgents(): AgentDefinition[] {
  return AGENTS
}

export function resolveAgentResultActions(
  agent: AgentDefinition,
  result: Record<string, unknown> | null,
): AgentActionCard[] {
  return agent.resultActions
    .filter((action) => !action.condition || action.condition(result))
    .map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      kind: "navigate" as const,
      href: action.href,
      label: action.label,
    }))
}

const JOB_KEYWORDS: Record<string, RegExp> = {}

export function isAgentJobRequest(text: string, agent: AgentDefinition): boolean {
  const pattern = JOB_KEYWORDS[agent.jobType]
  if (!pattern) return false
  return pattern.test(text)
}

export function isAgentConfirmation(text: string): boolean {
  return /^(yes|yeah|yep|sure|ok|okay|go|run|start|confirm|давай|запускай|погнали)\b/i.test(text.trim())
}

export function isAgentCancellation(text: string): boolean {
  return /^(no|nope|cancel|stop|abort|skip|отмена|не\s+надо)\b/i.test(text.trim())
}

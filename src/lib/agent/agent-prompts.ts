export interface AgentSuggestedPrompt {
  id: string
  label: string
  prompt: string
}

export const AGENT_SUGGESTED_PROMPTS: AgentSuggestedPrompt[] = [
  {
    id: "progress",
    label: "How am I doing?",
    prompt: "How am I doing this week?",
  },
  {
    id: "review",
    label: "Start review",
    prompt: "Start a review session",
  },
  {
    id: "reader",
    label: "Open Reader",
    prompt: "Open Reader",
  },
  {
    id: "card",
    label: "Create a card",
    prompt: "Create a flashcard",
  },
  {
    id: "explain",
    label: "Explain a word",
    prompt: "Explain a word",
  },
  {
    id: "vocabulary",
    label: "View vocabulary",
    prompt: "Show my vocabulary",
  },
]

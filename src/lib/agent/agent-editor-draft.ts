const AGENT_EDITOR_DRAFT_KEY = "polyraspad.agentEditorDraft.v1"

export function saveAgentEditorDraft(fields: Record<string, string>): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(AGENT_EDITOR_DRAFT_KEY, JSON.stringify(fields))
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumeAgentEditorDraft(): Record<string, string> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(AGENT_EDITOR_DRAFT_KEY)
    if (!raw) return null
    window.sessionStorage.removeItem(AGENT_EDITOR_DRAFT_KEY)
    const parsed = JSON.parse(raw) as Record<string, string>
    if (!parsed || typeof parsed !== "object") return null
    return parsed
  } catch {
    return null
  }
}

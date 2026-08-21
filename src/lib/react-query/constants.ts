// Query keys for projects
export const projectQueryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
};

// Query keys for user
export const userQueryKeys = {
  userInfo: ["userInfo"] as const,
  userSettings: ["userSettings"] as const,
};

// Query keys for decks
export const deckQueryKeys = {
  deckTree: (projectId: string, libraryFilter?: string) =>
    (["decks", "tree", projectId, libraryFilter ?? null] as const),
  deck: (id: string) => ["decks", id] as const,
};

/** Reader / text analyze cache keys (reserve for React Query migration). */
export const readerQueryKeys = {
  analyze: (projectId: string, fingerprint: string) =>
    ["reader", "analyze", projectId, fingerprint] as const,
  preferences: ["reader", "preferences"] as const,
};

// Query keys for analytics
export const analyticsQueryKeys = {
  vocabularyStats: (projectId: string) => ["analytics", "vocabulary", projectId] as const,
  heatmap: (projectId?: string, year?: number) => ["analytics", "heatmap", projectId, year] as const,
  dailySummary: (projectId?: string) => ["analytics", "daily", projectId] as const,
  skillBalance: (projectId: string) => ["analytics", "skills", projectId] as const,
};

// Query keys for agent chat
export const agentQueryKeys = {
  threadsBase: (projectId: string) => ["agent", "threads", projectId] as const,
  threads: (projectId: string, agentId?: string) =>
    ["agent", "threads", projectId, agentId ?? null] as const,
  messages: (threadId: string) => ["agent", "messages", threadId] as const,
};

// Query keys for SaaS billing
export const billingQueryKeys = {
  all: ["billing"] as const,
  access: ["billing", "access"] as const,
  entitlements: ["billing", "entitlements"] as const,
  usage: ["billing", "usage"] as const,
  subscription: ["billing", "subscription"] as const,
  plans: (onlyActive: boolean) => ["billing", "plans", onlyActive] as const,
  invoices: (page: number, pageSize: number) => ["billing", "invoices", page, pageSize] as const,
};

// Query keys for cards
export const cardQueryKeys = {
  cards: ["cards"] as const,
  card: (id: string) => ["cards", id] as const,
  noteTypeEditor: (projectId: string) => ["cards", "note-type-editor", projectId] as const,
  searchCards: (query: string, options?: { projectId?: string; deckId?: string; srsStatuses?: string[]; pageNumber?: number; pageSize?: number }) =>
    ["cards", "search", query, options] as const,
};

// Query keys for automation jobs
export const automationQueryKeys = {
  jobs: ["automation", "jobs"] as const,
  job: (id: string) => ["automation", "jobs", id] as const,
};

// Combined query keys for backward compatibility
export const queryKeys = {
  ...projectQueryKeys,
  ...userQueryKeys,
  ...deckQueryKeys,
  ...analyticsQueryKeys,
  ...cardQueryKeys,
  agent: agentQueryKeys,
  reader: readerQueryKeys,
  terms: {
    list: (projectId: string, status: string, type: string, q: string) =>
      ["terms", "list", projectId, status, type, q] as const,
  },
};

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
  deckTree: (projectId: string) => ["decks", "tree", projectId] as const,
  deck: (id: string) => ["decks", id] as const,
};

// Query keys for analytics
export const analyticsQueryKeys = {
  vocabularyStats: (projectId: string) => ["analytics", "vocabulary", projectId] as const,
  heatmap: (projectId?: string, year?: number) => ["analytics", "heatmap", projectId, year] as const,
  dailySummary: (projectId?: string) => ["analytics", "daily", projectId] as const,
};

// Query keys for cards
export const cardQueryKeys = {
  cards: ["cards"] as const,
  card: (id: string) => ["cards", id] as const,
  searchCards: (query: string, options?: { projectId?: string; deckId?: string; srsStatuses?: string[]; pageNumber?: number; pageSize?: number }) =>
    ["cards", "search", query, options] as const,
};

// Combined query keys for backward compatibility
export const queryKeys = {
  ...projectQueryKeys,
  ...userQueryKeys,
  ...deckQueryKeys,
  ...analyticsQueryKeys,
  ...cardQueryKeys,
};
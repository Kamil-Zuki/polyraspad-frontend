/**
 * Константы приложения
 */

export const APP_NAME = "Polyraspad"
export const APP_DESCRIPTION = "Personal Vocabulary Learning Platform"

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/Auth/login",
    REGISTER: "/api/Auth/register",
    ME: "/api/Auth/me",
    REFRESH: "/api/Auth/refresh-token",
    LOGOUT: "/api/Auth/logout",
    UPDATE_USERNAME: "/api/Auth/username",
    UPDATE_AVATAR_URL: "/api/Auth/avatar-url",
    UPDATE_PASSWORD: "/api/Auth/password",
    CONFIRM_EMAIL: "/api/Auth/confirm-email",
    RESEND_CONFIRMATION: "/api/Auth/resend-confirmation",
  },
  PROJECTS: {
    LIST: "/api/Projects",
    DETAIL: (id: string) => `/api/Projects/${id}`,
    CREATE: "/api/Projects",
    UPDATE: (id: string) => `/api/Projects/${id}`,
    DELETE: (id: string) => `/api/Projects/${id}`,
  },
  DECKS: {
    TREE: (projectId: string) => `/api/Decks/tree/${projectId}`,
    GET: (id: string) => `/api/Decks/${id}`,
    CREATE: "/api/Decks",
    UPDATE: (id: string) => `/api/Decks/${id}`,
    DELETE: (id: string) => `/api/Decks/${id}`,
  },
  CARDS: {
    CREATE: "/api/Cards",
    CAPTURE: "/api/Cards/capture",
    CHECK_DUPLICATES: "/api/Cards/check-duplicates",
    SEARCH: "/api/Cards/search",
    GET: (id: string) => `/api/Cards/${id}`,
    UPDATE: (id: string) => `/api/Cards/${id}`,
    DELETE: (id: string) => `/api/Cards/${id}`,
    BULK_CREATE: "/api/Cards/import",
    IMPORT_FILE: "/api/Cards/import-file",
    IMPORT_JOB: (id: string) => `/api/Cards/import-job/${id}`,
    BULK_DELETE: "/api/Cards/bulk-delete",
    BULK_MOVE: "/api/Cards/move",
    BULK_RESET_PROGRESS: "/api/Cards/bulk-reset-progress",
    LEECHES: "/api/Cards/leeches",
    MISSING_MEDIA: "/api/Cards/missing-media",
    /** Anki-like note type + templates for the editor */
    NOTE_TYPE_EDITOR: (projectId: string) =>
      `/api/Cards/note-type/editor?projectId=${encodeURIComponent(projectId)}`,
  },
  MEDIA: {
    UPLOAD_IMAGE: "/api/Media/upload-image",
    UPLOAD_DOCUMENT: "/api/Media/upload-document",
    SERVE_DOCUMENT: "/api/Media/serve-document",
    GENERATE_AUDIO: "/api/Media/generate-audio",
    READER_LIBRARY: (projectId: string) => `/api/Media/library/${projectId}`,
    READER_LIBRARY_BOOK: (projectId: string, bookId: string) => `/api/Media/library/${projectId}/books/${bookId}`,
    READER_COLLECTIONS: (projectId: string) => `/api/Media/library/${projectId}/collections`,
    READER_COLLECTION: (projectId: string, collectionId: string) => `/api/Media/library/${projectId}/collections/${collectionId}`,
    READER_COLLECTION_SHARE: (projectId: string, collectionId: string) => `/api/Media/library/${projectId}/collections/${collectionId}/share`,
    READER_COLLECTION_UNSHARE: (projectId: string, collectionId: string, collaboratorUserId: string) =>
      `/api/Media/library/${projectId}/collections/${collectionId}/share/${collaboratorUserId}`,
    SHARED_READER_COLLECTIONS: "/api/Media/library/shared-collections",
  },
  USER_SETTINGS: {
    GET: "/api/settings",
    UPDATE: "/api/settings",
  },
  ANALYTICS: {
    VOCABULARY: (projectId: string) => `/api/Analytics/vocabulary?projectId=${projectId}`,
    HEATMAP: (projectId?: string, year?: number) => {
      let url = "/api/Analytics/heatmap";
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (year) params.append("year", year.toString());
      const query = params.toString();
      return query ? `${url}?${query}` : url;
    },
    DAILY: (projectId?: string) => {
      let url = "/api/Analytics/daily";
      if (projectId) url += `?projectId=${projectId}`;
      return url;
    },
    SKILLS: (projectId: string) => `/api/Analytics/skills?projectId=${projectId}`,
  },
  TEXT: {
    ANALYZE: "/api/text/analyze",
  },
  TERMS: {
    /** GET list (query string) и POST create/update — один путь, разные методы */
    LIST: "/api/terms",
    CREATE_OR_UPDATE: "/api/terms",
    // Должно совпадать с Aggregator: TermsController [HttpPost("mark-known")]
    KNOWN: "/api/terms/mark-known",
    IGNORE: "/api/terms/ignore",
    BULK_KNOWN: "/api/terms/bulk-known",
    DETAILS: "/api/terms/details",
    // Должно совпадать с Aggregator: TermsController [HttpPost("search-duplicates")]
    DUPLICATES: "/api/terms/search-duplicates",
  },
  STUDY: {
    START_SESSION: "/api/study/session",
    NEXT_CARD: (sessionId: string) => `/api/study/session/${sessionId}/next`,
    SUBMIT_REVIEW: (sessionId: string) => `/api/study/session/${sessionId}/review`,
    UNDO: (sessionId: string) => `/api/study/session/${sessionId}/undo`,
  },
  MARKETPLACE: {
    PRODUCTS: "/api/marketplace/products",
    PRODUCT: (id: string) => `/api/marketplace/products/${id}`,
    PRODUCT_PREVIEW: (id: string) => `/api/marketplace/products/${id}/preview`,
    PRODUCT_REVIEWS: (id: string) => `/api/marketplace/products/${id}/reviews`,
  },
  SUBSCRIPTIONS: {
    LIST: "/api/subscriptions",
    DELETE: (deckId: string) => `/api/subscriptions/${deckId}`,
  },
  BILLING: {
    ACCESS: "/api/Billing/access",
    ENTITLEMENTS: "/api/Billing/entitlements",
    USAGE: "/api/Billing/usage",
    SUBSCRIPTION: "/api/Billing/subscription",
    PLANS: "/api/Billing/plans",
    CHECKOUT: "/api/Billing/checkout",
    CANCEL: "/api/Billing/subscription/cancel",
    INVOICES: "/api/Billing/invoices",
  },
  AUTOMATION: {
    AUTOPILOT: "/api/automation/autopilot",
    RECOMMENDATIONS: "/api/automation/recommendations",
    NOTIFICATION_PREFERENCES: "/api/automation/notifications/preferences",
    JOBS: "/api/automation/jobs",
    JOB: (id: string) => `/api/automation/jobs/${id}`,
    JOB_RETRY: (id: string) => `/api/automation/jobs/${id}/retry`,
    JOB_RESUME: (id: string) => `/api/automation/jobs/${id}/resume`,
    MINING_SUGGEST: "/api/automation/mining/suggest",
    MINING_APPROVE: "/api/automation/mining/approve",
    COPILOT_REVIEW_FEEDBACK: "/api/automation/copilot/review-feedback",
    EXPERIMENT_ASSIGNMENT: "/api/automation/experiments/assignment",
    EXPERIMENT_EVENTS: "/api/automation/experiments/events",
  },
  INTEGRATIONS: {
    PROVIDERS: "/api/integrations/providers",
    TRANSLATE: "/api/integrations/translate",
    DICTIONARY_LOOKUP: "/api/integrations/dictionary/lookup",
  },
  AGENT: {
    THREADS: (projectId: string, agentId?: string) => {
      const params = new URLSearchParams({ projectId })
      if (agentId) params.set("agentId", agentId)
      return `/api/agent/threads?${params.toString()}`
    },
    CREATE_THREAD: "/api/agent/threads",
    THREAD: (threadId: string) => `/api/agent/threads/${encodeURIComponent(threadId)}`,
    MESSAGES: (threadId: string, limit = 100, before?: string) => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (before) params.set("before", before)
      return `/api/agent/threads/${encodeURIComponent(threadId)}/messages?${params.toString()}`
    },
    CREATE_RUN: (threadId: string) =>
      `/api/agent/threads/${encodeURIComponent(threadId)}/runs`,
    STREAM_RUN: (threadId: string) =>
      `/api/agent/threads/${encodeURIComponent(threadId)}/runs/stream`,
    PERSIST_RUN: (threadId: string) =>
      `/api/agent/threads/${encodeURIComponent(threadId)}/runs/persist`,
    ARCHIVE_THREAD: (threadId: string) =>
      `/api/agent/threads/${encodeURIComponent(threadId)}/archive`,
  },
} as const

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  PROJECTS: "/projects",
  DASHBOARD: "/dashboard",
  /** Deck tree and study entry (SRS cards) */
  DECKS: "/decks",
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  /** LingQ-style reader (reading session) */
  READER: "/reader",
  /** Book library and collections */
  LIBRARY: "/library",
  /** Text Workspace editor */
  LIBRARY_EDITOR: "/library/editor",
  /** Профиль и настройки пользователя */
  PROFILE: "/profile",
  /** Редирект на PROFILE */
  SETTINGS: "/profile",
} as const

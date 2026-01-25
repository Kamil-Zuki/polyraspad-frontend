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
  },
  PROJECTS: {
    LIST: "/api/Projects",
    DETAIL: (id: string) => `/api/Projects/${id}`,
    CREATE: "/api/Projects",
    UPDATE: (id: string) => `/api/Projects/${id}`,
  },
  DECKS: {
    TREE: (projectId: string) => `/api/Decks/tree/${projectId}`,
    CREATE: "/api/Decks",
    UPDATE: (id: string) => `/api/Decks/${id}`,
    DELETE: (id: string) => `/api/Decks/${id}`,
  },
  USER_SETTINGS: {
    GET: "/api/settings",
    UPDATE: "/api/settings",
  },
  ANALYTICS: {
    VOCABULARY: (projectId: string) => `/api/analytics/vocabulary?projectId=${projectId}`,
    HEATMAP: (projectId?: string, year?: number) => {
      const params = new URLSearchParams()
      if (projectId) params.append('projectId', projectId)
      if (year) params.append('year', year.toString())
      return `/api/analytics/heatmap${params.toString() ? `?${params.toString()}` : ''}`
    },
    DAILY: (projectId?: string) => {
      const params = new URLSearchParams()
      if (projectId) params.append('projectId', projectId)
      return `/api/analytics/daily${params.toString() ? `?${params.toString()}` : ''}`
    },
  },
} as const

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  PROJECTS: "/projects",
  DASHBOARD: "/dashboard",
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  SETTINGS: "/settings",
} as const

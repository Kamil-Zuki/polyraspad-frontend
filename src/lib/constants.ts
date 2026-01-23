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
    GET: "/api/UserSettings",
    UPDATE: "/api/UserSettings",
  },
} as const

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  PROJECTS: "/projects",
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  SETTINGS: "/settings",
} as const

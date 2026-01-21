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
  },
} as const

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  PROJECTS: "/projects",
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
} as const

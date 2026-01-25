import {
  UserLoginDto,
  UserRegistrationDto,
  TokenResponseDto,
  UserInfoDto,
  AuthResponseDto,
  UpdateUsernameDto,
  UpdatePasswordDto,
  ConfirmEmailDto,
  ProjectResponseDto,
  CreateProjectDto,
  UpdateProjectDto,
  DeckResponseDto,
  DeckTreeItemDto,
  CreateDeckDto,
  UpdateDeckDto,
  UserSettingsResponseDto,
  UpdateUserSettingsDto,
  VocabularyStatsDto,
  HeatmapDto,
  DailySummaryDto,
  CardResponseDto,
  CreateCardDto,
  CaptureCardDto,
  UpdateCardDto,
  BulkCreateCardsDto,
  SearchCardsResponseDto,
} from "./types"
import { ApiError } from "./errors"
import { API_ENDPOINTS } from "../constants"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }

    // Логирование для отладки (только в development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${options.method || 'GET'} ${url}`, {
        body: options.body,
        headers: config.headers,
      })
    }

    const response = await fetch(url, config)

    if (response.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        // Используем window.location для гарантированного редиректа
        window.location.href = "/auth"
      }
      throw ApiError.fromResponse(
        { detail: "Unauthorized" },
        response.status
      )
    }

    if (!response.ok) {
      let error: any = { detail: "Unknown error" }
      const contentType = response.headers.get("content-type")
      
      try {
        if (contentType && contentType.includes("application/json")) {
          error = await response.json()
          
          // Обработка формата AggregatorService: { error: "..." }
          if (error.error && !error.detail) {
            error.detail = error.error
            // Если это общее сообщение об исключении, пытаемся извлечь полезную информацию
            if (error.detail.includes("ResponseException") && error.detail.includes("was thrown")) {
              // Пытаемся найти более конкретное сообщение
              // Обычно это "User not found" или "Invalid login attempt"
              if (error.detail.includes("User not found")) {
                error.detail = "Пользователь не найден. Проверьте email или зарегистрируйтесь."
              } else if (error.detail.includes("Invalid login attempt")) {
                error.detail = "Неверный email или пароль"
              } else {
                error.detail = "Ошибка авторизации. Проверьте данные и попробуйте снова."
              }
            }
          }
          // Обработка формата authorization-module: { Errors: [{ ErrorMessage: "..." }] }
          else if (error.Errors && Array.isArray(error.Errors) && error.Errors.length > 0) {
            const firstError = error.Errors[0]
            error.detail = firstError.ErrorMessage || firstError.message || error.detail
          }
          // Обработка формата ProblemDetails с errors: { errors: { Email: [...], Password: [...] } }
          else if (error.errors && typeof error.errors === 'object') {
            const errorMessages: string[] = []
            Object.keys(error.errors).forEach(key => {
              const fieldErrors = error.errors[key]
              if (Array.isArray(fieldErrors)) {
                errorMessages.push(...fieldErrors)
              }
            })
            if (errorMessages.length > 0) {
              error.detail = errorMessages[0] // Берем первую ошибку
            }
          }
          // ProblemDetails format: { detail, title, status, type, instance }
          else if (!error.detail && error.title) {
            error.detail = error.title
          }
        } else {
          // Если ответ не JSON, читаем как текст
          const text = await response.text().catch(() => "")
          error = { detail: text || `HTTP ${response.status}: ${response.statusText}` }
        }
      } catch (e) {
        // Если не удалось распарсить, используем статус
        error = { 
          detail: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status 
        }
      }
      
      throw ApiError.fromResponse(error, response.status)
    }

    return response.json()
  }

  // Auth endpoints
  async login(data: UserLoginDto): Promise<TokenResponseDto> {
    return this.request<TokenResponseDto>(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async register(data: UserRegistrationDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.REGISTER, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getUserInfo(): Promise<UserInfoDto> {
    return this.request<UserInfoDto>(API_ENDPOINTS.AUTH.ME)
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    return this.request<TokenResponseDto>(API_ENDPOINTS.AUTH.REFRESH, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
  }

  async logout(refreshToken?: string): Promise<AuthResponseDto> {
    const token = refreshToken || (typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null)
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      body: JSON.stringify({ refreshToken: token || "" }),
    })
  }

  async updateUsername(data: UpdateUsernameDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.UPDATE_USERNAME, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async updatePassword(data: UpdatePasswordDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>(API_ENDPOINTS.AUTH.UPDATE_PASSWORD, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async confirmEmail(data: ConfirmEmailDto): Promise<AuthResponseDto> {
    const params = new URLSearchParams()
    params.append('userId', data.userId)
    params.append('token', data.token)
    return this.request<AuthResponseDto>(`${API_ENDPOINTS.AUTH.CONFIRM_EMAIL}?${params.toString()}`)
  }

  // Project endpoints
  async getProjects(includeArchived = false): Promise<ProjectResponseDto[]> {
    return this.request<ProjectResponseDto[]>(
      `${API_ENDPOINTS.PROJECTS.LIST}?includeArchived=${includeArchived}`
    )
  }

  async getProject(id: string): Promise<ProjectResponseDto> {
    return this.request<ProjectResponseDto>(API_ENDPOINTS.PROJECTS.DETAIL(id))
  }

  async createProject(data: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.request<ProjectResponseDto>(API_ENDPOINTS.PROJECTS.CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<ProjectResponseDto> {
    return this.request<ProjectResponseDto>(API_ENDPOINTS.PROJECTS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Deck endpoints
  async getDeckTree(projectId: string): Promise<DeckTreeItemDto[]> {
    return this.request<DeckTreeItemDto[]>(API_ENDPOINTS.DECKS.TREE(projectId))
  }

  async createDeck(data: CreateDeckDto): Promise<DeckResponseDto> {
    return this.request<DeckResponseDto>(API_ENDPOINTS.DECKS.CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateDeck(id: string, data: UpdateDeckDto): Promise<DeckResponseDto> {
    return this.request<DeckResponseDto>(API_ENDPOINTS.DECKS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getDeck(id: string): Promise<DeckResponseDto> {
    return this.request<DeckResponseDto>(API_ENDPOINTS.DECKS.GET(id))
  }

  async deleteDeck(id: string): Promise<void> {
    return this.request<void>(API_ENDPOINTS.DECKS.DELETE(id), {
      method: "DELETE",
    })
  }

  // User Settings endpoints
  async getUserSettings(): Promise<UserSettingsResponseDto> {
    return this.request<UserSettingsResponseDto>(API_ENDPOINTS.USER_SETTINGS.GET)
  }

  async updateUserSettings(data: UpdateUserSettingsDto): Promise<UserSettingsResponseDto> {
    return this.request<UserSettingsResponseDto>(API_ENDPOINTS.USER_SETTINGS.UPDATE, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Analytics endpoints
  async getVocabularyStats(projectId: string): Promise<VocabularyStatsDto> {
    return this.request<VocabularyStatsDto>(API_ENDPOINTS.ANALYTICS.VOCABULARY(projectId))
  }

  async getHeatmap(projectId?: string, year?: number): Promise<HeatmapDto> {
    return this.request<HeatmapDto>(API_ENDPOINTS.ANALYTICS.HEATMAP(projectId, year))
  }

  async getDailySummary(projectId?: string): Promise<DailySummaryDto> {
    return this.request<DailySummaryDto>(API_ENDPOINTS.ANALYTICS.DAILY(projectId))
  }

  // Card endpoints
  async createCard(data: CreateCardDto): Promise<CardResponseDto> {
    return this.request<CardResponseDto>(API_ENDPOINTS.CARDS.CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async captureCard(data: CaptureCardDto): Promise<CardResponseDto> {
    return this.request<CardResponseDto>(API_ENDPOINTS.CARDS.CAPTURE, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async searchCards(
    query: string,
    options?: {
      projectId?: string
      deckId?: string
      srsStatuses?: string[]
      pageNumber?: number
      pageSize?: number
    }
  ): Promise<SearchCardsResponseDto> {
    const params = new URLSearchParams()
    params.append('query', query)
    if (options?.projectId) params.append('projectId', options.projectId)
    if (options?.deckId) params.append('deckId', options.deckId)
    if (options?.pageNumber) params.append('pageNumber', options.pageNumber.toString())
    if (options?.pageSize) params.append('pageSize', options.pageSize.toString())
    if (options?.srsStatuses && options.srsStatuses.length > 0) {
      options.srsStatuses.forEach(status => params.append('srsStatuses', status))
    }
    return this.request<SearchCardsResponseDto>(`${API_ENDPOINTS.CARDS.SEARCH}?${params.toString()}`)
  }

  async getCard(id: string): Promise<CardResponseDto> {
    return this.request<CardResponseDto>(API_ENDPOINTS.CARDS.GET(id))
  }

  async updateCard(id: string, data: UpdateCardDto): Promise<CardResponseDto> {
    return this.request<CardResponseDto>(API_ENDPOINTS.CARDS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async bulkCreateCards(data: BulkCreateCardsDto): Promise<CardResponseDto[]> {
    return this.request<CardResponseDto[]>(API_ENDPOINTS.CARDS.BULK_CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()

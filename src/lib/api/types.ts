// Auth types
export interface UserLoginDto {
  email: string
  password: string
}

export interface UserRegistrationDto {
  email: string
  password: string
  confirmPassword: string
}

export interface TokenResponseDto {
  accessToken: string
  refreshToken: string
}

export interface UserInfoDto {
  id: string
  userName: string
  email: string
  emailConfirmed: boolean
}

export interface AuthResponseDto {
  message: string
}

export interface RefreshTokenDto {
  refreshToken: string
}

export interface LogoutDto {
  refreshToken: string
}

// Project types
export interface ProjectResponseDto {
  id: string
  userId: string
  title: string
  sourceLang: string
  targetLang: string
  settings?: SrsSettingsDto
  stats?: ProjectStatsDto
  isArchived: boolean
  createdAt: string
}

export interface ProjectStatsDto {
  totalLemmas: number
  matureLemmas: number
}

export interface SrsSettingsDto {
  requestRetention: number
  maximumInterval: number
  w?: number[]
  enableShortTerm: boolean
}

export interface CreateProjectDto {
  title: string
  sourceLang: string
  targetLang: string
  settings?: SrsSettingsDto
}

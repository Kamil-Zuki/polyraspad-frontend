// Auth types
export interface UserLoginDto {
  email: string;
  password: string;
}

export interface UserRegistrationDto {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export interface UserInfoDto {
  id: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
}

export interface AuthResponseDto {
  message: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface LogoutDto {
  refreshToken: string;
}

// Project types
export interface ProjectResponseDto {
  id: string;
  userId: string;
  title: string;
  sourceLang: string;
  targetLang: string;
  settings?: SrsSettingsDto;
  stats?: ProjectStatsDto;
  isArchived: boolean;
  createdAt: string;
}

export interface ProjectStatsDto {
  totalLemmas: number;
  matureLemmas: number;
}

export interface SrsSettingsDto {
  requestRetention: number;
  maximumInterval: number;
  w?: number[];
  enableShortTerm: boolean;
}

export interface CreateProjectDto {
  title: string;
  sourceLang: string;
  targetLang: string;
  settings?: SrsSettingsDto;
}

export interface UpdateProjectDto {
  title?: string;
  isArchived?: boolean;
  settings?: SrsSettingsDto;
}

// Deck types
export interface DeckResponseDto {
  id: string;
  projectId: string;
  parentDeckId?: string | null;
  ownerId: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublic: boolean;
  contributionPolicy: ContributionPolicyDto;
  licenseType: LicenseTypeDto;
  forkedFromId?: string | null;
  cardCount: number;
  createdAt: string;
}

export enum ContributionPolicyDto {
  Open = 0,
  Restricted = 1,
  Closed = 2,
}

export enum LicenseTypeDto {
  Private = 0,
  FreeAttribution = 1,
  Commercial = 2,
  CommercialDerivative = 3,
}

export interface DeckTreeItemDto {
  id: string;
  title: string;
  cardCount: number;
  children: DeckTreeItemDto[];
}

export interface CreateDeckDto {
  projectId: string;
  title: string;
  description?: string | null;
  parentDeckId?: string | null;
  isPublic: boolean;
  coverImageUrl?: string | null;
}

export interface UpdateDeckDto {
  title?: string | null;
  description?: string | null;
  parentDeckId?: string | null;
  isPublic?: boolean | null;
  coverImageUrl?: string | null;
  contributionPolicy?: ContributionPolicyDto | null;
}

// User Settings types
export interface UserSettingsResponseDto {
  userId: string;
  rolloverHour: number;
  dailyGoalNew: number;
  dailyGoalReview: number;
  interfaceLanguage: string;
  currentStreak: number;
  maxStreak: number;
}

export interface UpdateUserSettingsDto {
  rolloverHour?: number | null;
  dailyGoalNew?: number | null;
  dailyGoalReview?: number | null;
  interfaceLanguage?: string | null;
}

// Analytics types
export interface VocabularyStatsDto {
  projectId: string;
  totalLemmas: number;
  matureCount: number;
  learningCount: number;
  newCount: number;
  cefrLevel: {
    code: string;
    title: string;
    progressPercent: number;
  };
  estimatedFluency: number;
}

export interface HeatmapDto {
  projectId?: string | null;
  year: number;
  totalReviews: number;
  activity: Record<string, { count: number; level: number }>;
}

export interface DailySummaryDto {
  date: string;
  currentStreak: number;
  isStreakExtendedToday: boolean;
  timeSpentSeconds: number;
  newCards: {
    current: number;
    target: number;
    isCompleted: boolean;
  };
  reviews: {
    current: number;
    target: number;
    isCompleted: boolean;
  };
}

// Card types
export interface CardResponseDto {
  id: string;
  deckId: string;
  creatorId: string;
  sentence: string;
  translation: string;
  targetWord: string;
  targetIndex?: TargetIndexDto | null;
  sourceMeta?: SourceMetaDto | null;
  media?: CardMediaDto | null;
  lemmaId?: string | null;
  srsStatus: string;
  createdAt: string;
}

export interface CardMediaDto {
  imageId?: string | null;
  audioId?: string | null;
}

export interface SourceMetaDto {
  type: string;
  title: string;
  url?: string | null;
  page?: number | null;
  timestamp?: number | null;
  service?: string | null;
}

export interface TargetIndexDto {
  start: number;
  len: number;
}

export interface CreateCardDto {
  deckId: string;
  sentence: string;
  targetWord: string;
  translation: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  sourceMeta?: SourceMetaDto | null;
}

export interface CaptureCardDto {
  projectId: string;
  sentence: string;
  targetWord: string;
  translation: string;
  sourceMeta?: SourceMetaDto | null;
  screenshotBase64?: string | null;
}

export interface UpdateCardDto {
  sentence?: string | null;
  translation?: string | null;
  targetWord?: string | null;
  targetIndex?: TargetIndexDto | null;
  sourceMeta?: SourceMetaDto | null;
}

export interface BulkCreateCardsDto {
  deckId: string;
  cards: CreateCardDto[];
}

export interface PaginatedResponseDto<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SearchCardsResponseDto extends PaginatedResponseDto<CardResponseDto> {}

// Auth additional types
export interface UpdateUsernameDto {
  userName: string;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ConfirmEmailDto {
  userId: string;
  token: string;
}

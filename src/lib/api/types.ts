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
  /** Profile picture URL (https), persisted on the account */
  avatarUrl?: string | null;
  roles?: string[];
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
  ttsSettings?: TtsSettingsDto;
  stats?: ProjectStatsDto;
  isArchived: boolean;
  createdAt: string;
}

export interface ProjectStatsDto {
  totalTerms: number;
  knownTerms: number;
}

export interface SrsSettingsDto {
  requestRetention: number;
  maximumInterval: number;
  w?: number[];
  enableShortTerm: boolean;
}

export interface TtsSettingsDto {
  voiceName?: string | null;
  rate: number;
  pitch: number;
}

export interface CreateProjectDto {
  title: string;
  sourceLang: string;
  targetLang: string;
  settings?: SrsSettingsDto;
  ttsSettings?: TtsSettingsDto;
}

export interface UpdateProjectDto {
  title?: string;
  isArchived?: boolean;
  settings?: SrsSettingsDto;
  ttsSettings?: TtsSettingsDto;
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

/** Stats returned by GET /api/Decks/{id} (DeckDetailDto) */
export interface DeckDetailStatsDto {
  newCardsCount: number;
  learningCardsCount: number;
  dueCardsCount: number;
  studyableNowCount: number;
  totalCardsCount: number;
}

/** Deck detail with SRS stats (GET /api/Decks/{id}) */
export interface DeckDetailDto extends DeckResponseDto {
  stats?: DeckDetailStatsDto;
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
  ownerId?: string;
  isPublic?: boolean;
  forkedFromId?: string | null;
  coverImageUrl?: string | null;
  stats?: DeckDetailStatsDto;
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

export interface SkillBalanceDto {
  projectId: string;
  averageReadingLevel: number;
  averageListeningLevel: number;
  averageWritingLevel: number;
  averageSpeakingLevel: number;
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
  totalTerms: number;
  matureCount: number;
  savedCount?: number;
  reviewingCount?: number;
  learningCount: number;
  newCount: number;
  cefrLevel: {
    code: string;
    title: string;
    progressPercent: number;
    wordsToNextLevel?: number;
  };
  estimatedFluency: number;
}

export interface HeatmapDto {
  projectId?: string | null;
  year: number;
  totalReviews: number;
  activity: Record<string, { count: number; level: number }>;
  /** Самая длинная серия дней подряд с активностью (опционально с бэкенда) */
  longestStreak?: number;
  /** Суммарное время учёбы в секундах за период (опционально с бэкенда) */
  totalTimeSpentSeconds?: number;
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

// Reader / Text analysis (SR-TXT-01)
export type TextTokenStatus = "KNOWN" | "LEARNING" | "NEW" | "IGNORED" | "NONE";

export interface TextTokenDto {
  text: string;
  termText?: string | null;
  status?: TextTokenStatus | null;
  type?: "WORD" | "SPACE" | "PUNCTUATION" | null;
  projectTermId?: string | null;
}

/** Multi-token phrase spans from analyze (phrase highlight priority over words). Optional until Aggregator exposes phrases in JSON. */
export interface TextPhraseDto {
  startIndex: number;
  endIndex: number;
  text: string;
  /** NEW | LEARNING | SAVED | KNOWN | IGNORED (SAVED maps to LEARNING in tokens) */
  status?: string | null;
  projectTermId?: string | null;
  /** @deprecated use projectTermId */
  termId?: string | null;
}

export interface TextAnalyzeResponseDto {
  tokens: TextTokenDto[];
  phrases?: TextPhraseDto[];
  stats: {
    uniqueWords: number;
    knownPercentage: number;
    /** Поля ниже приходят с Aggregator / VocabularyService при серверном анализе */
    newWordsCount?: number;
    learningWordsCount?: number;
    knownWordsCount?: number;
  };
}

export interface TextAnalyzeRequestDto {
  projectId: string;
  text: string;
}

// Card types
/** One dynamic slot in a note (Anki-like field map). */
export interface NoteFieldValueDto {
  stringValue?: string | null;
  stringValues?: string[] | null;
}

export interface NotePayloadDto {
  id: string;
  noteTypeId: string;
  fieldValues: Record<string, NoteFieldValueDto>;
  projectTermId?: string | null;
}

export interface CardTemplateDto {
  id: string;
  templateKey: string;
  name: string;
  frontTemplate: string;
  backTemplate: string;
  sortOrder: number;
  enabled: boolean;
}

export interface NoteFieldDefinitionDto {
  fieldKey: string;
  label: string;
  fieldType: string;
  sortOrder: number;
  required: boolean;
  archived: boolean;
}

export interface NoteTypeForEditorDto {
  id: string;
  projectId: string;
  name: string;
  version: number;
  fields: NoteFieldDefinitionDto[];
  templates: CardTemplateDto[];
}

export interface GetNoteTypeForEditorResponseDto {
  noteType: NoteTypeForEditorDto;
  defaultTemplate: CardTemplateDto | null;
}

export interface CardResponseDto {
  id: string;
  deckId: string;
  creatorId: string;
  note?: NotePayloadDto | null;
  activeCardTemplate?: CardTemplateDto | null;
  projectTermId?: string | null;
  srsStatus: string;
  createdAt: string;
  srsState?: SrsStateDto | null;
}

export interface CardMediaDto {
  imageId?: string | null;
  audioId?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
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
  fieldValues: Record<string, NoteFieldValueDto>;
}

export interface CaptureCardDto {
  projectId: string;
  fieldValues: Record<string, NoteFieldValueDto>;
  screenshotBase64?: string | null;
  /** When omitted, backend uses the project Inbox deck. */
  deckId?: string | null;
}

export interface CheckCardDuplicatesRequestDto {
  projectId: string;
  termText: string;
}

export interface CheckCardDuplicatesResponseDto {
  isDuplicate: boolean;
  normalizedSurface?: string | null;
  existingCards: CardPreviewDto[];
}

export interface CreateOrUpdateTermDto {
  projectId: string;
  termText: string;
  type?: "WORD" | "PHRASE";
  language?: string;
  status?: "NEW" | "SAVED" | "KNOWN" | "IGNORED";
  meaning?: string | null;
  firstSentence?: string | null;
  firstSourceTitle?: string | null;
  firstSourceUrl?: string | null;
}

export interface TermActionDto {
  projectId: string;
  termText: string;
  type?: "WORD" | "PHRASE";
  language?: string;
}

export interface BulkMarkKnownItemDto {
  termText: string;
  type?: "WORD" | "PHRASE";
}

export interface BulkMarkKnownDto {
  projectId: string;
  termTexts?: string[];
  items?: BulkMarkKnownItemDto[];
  language?: string;
}

export interface BulkMarkKnownResponseDto {
  updatedCount: number;
}

export interface TermDetailsDto {
  termId: string;
  projectId: string;
  termText: string;
  normalizedText: string;
  type: "WORD" | "PHRASE";
  language: string;
  status: "NEW" | "SAVED" | "KNOWN" | "IGNORED";
  meaning?: string | null;
  firstSentence?: string | null;
  firstSourceTitle?: string | null;
  firstSourceUrl?: string | null;
  relatedCards: CardPreviewDto[];
}

export interface SearchTermDuplicatesDto {
  projectId: string;
  termText: string;
  type?: "WORD" | "PHRASE";
}

export interface SearchTermDuplicatesResponseDto {
  isDuplicate: boolean;
  normalizedText: string;
  matchingTerms: TermDetailsDto[];
  existingCards: CardPreviewDto[];
}

/** Элемент GET /api/terms (список словаря проекта) */
export interface ProjectTermListItemDto {
  termId: string;
  text: string;
  normalizedText: string;
  type: "WORD" | "PHRASE";
  language: string;
  status: "NEW" | "SAVED" | "KNOWN" | "IGNORED";
  meaning?: string | null;
  firstSentence?: string | null;
  firstSourceTitle?: string | null;
  firstSourceUrl?: string | null;
  updatedAt: string;
  relatedCardCount?: number;
}

export interface ListProjectTermsResponseDto {
  items: ProjectTermListItemDto[];
  totalCount: number;
}

export interface UpdateCardDto {
  fieldValues: Record<string, NoteFieldValueDto>;
}

export interface BulkCreateCardsDto {
  deckId: string;
  cards: CreateCardDto[];
}

export interface BulkDeleteCardsDto {
  cardIds: string[];
}

export interface MoveCardsDto {
  cardIds: string[];
  deckId: string;
}

export interface ResetCardProgressDto {
  cardIds: string[];
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

/** Empty string clears the avatar on the server */
export interface UpdateAvatarUrlDto {
  avatarUrl: string;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ConfirmEmailDto {
  userId: string;
  token: string;
}

// Study session types (SR-LRN-01, SR-LRN-02, SR-LRN-03, SR-LRN-08)
export interface StartSessionRequestDto {
  projectId: string;
  deckId?: string | null;
  mode?: string | null; // STANDARD, etc.
}



export interface QueueStatsDto {
  new: number;
  review: number;
  learning: number;
}

export interface StudySessionDto {
  id: string;
  projectId: string;
  status: string; // ACTIVE, COMPLETED
  startTime: string;
  cardsReviewed: number;
  queueStats: QueueStatsDto;
}

export interface CardStudyContentDto {
  note: NotePayloadDto;
  targetIndex: TargetIndexDto;
}

export interface SrsStateDto {
  state: string; // NEW, LEARNING, REVIEW, RELEARNING, MATURE (legacy)
  currentInterval: number;
  step?: number;
  dueUtc?: string | null;
  lapses?: number;
  stability?: number;
  difficulty?: number;
  scheduledDays?: number;
  elapsedDays?: number;
}

export interface CardStudyDto {
  id: string;
  type: string; // SENTENCE_MINING
  content: CardStudyContentDto;
  sourceMeta?: SourceMetaDto | null;
  media?: CardMediaDto | null;
  srsState: SrsStateDto;
  nextIntervals: Record<number, string>;
  siblingsCount: number;
}

export interface ReviewCardRequestDto {
  cardId: string;
  rating: number; // 1=Again, 2=Hard, 3=Good, 4=Easy
  durationMs: number;
  userAnswer?: string | null;
}

export interface AnswerValidationResultDto {
  isCorrect: boolean;
  isFuzzyMatch: boolean;
  matchedSynonym?: string | null;
  similarityScore: number;
  suggestion?: string | null;
}

export interface ReviewResponseDto {
  cardId: string;
  nextReviewDate: string;
  interval: string;
  state: string;
  stability: number;
  isLeech?: boolean;
  buriedSiblingsCount?: number;
  answerValidation?: AnswerValidationResultDto | null;
}

export interface UndoReviewRequestDto {
  sessionId?: string | null;
}

export interface UndoResponseDto {
  success: boolean;
  restoredCardId: string;
  message?: string | null;
}

// Automation / Autonomy
export interface NextBestActionDto {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: number;
  deckId?: string | null;
}

export interface DailyAutopilotDto {
  userId: string;
  projectId: string;
  deckId?: string | null;
  planDate: string;
  suggestedMinutes: number;
  suggestedNewCards: number;
  suggestedReviews: number;
  backlogRiskScore: number;
  sessionMode: string;
  nextBestActions: NextBestActionDto[];
}

export interface NotificationPreferencesDto {
  enableStudyReminders: boolean;
  enableStreakRiskAlerts: boolean;
  enableBacklogAlerts: boolean;
  enableContributionEvents: boolean;
  enableMarketplaceEvents: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
}

export interface UpdateNotificationPreferencesDto {
  enableStudyReminders?: boolean | null;
  enableStreakRiskAlerts?: boolean | null;
  enableBacklogAlerts?: boolean | null;
  enableContributionEvents?: boolean | null;
  enableMarketplaceEvents?: boolean | null;
  pushEnabled?: boolean | null;
  emailEnabled?: boolean | null;
  inAppEnabled?: boolean | null;
  quietHoursStart?: number | null;
  quietHoursEnd?: number | null;
}

export interface AutomationJobDto {
  id: string;
  type: string;
  status: string;
  progressPercent: number;
  lastError?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  logs?: string[];
  result?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
}

export interface CreateAutomationJobDto {
  type: string;
  projectId?: string | null;
  deckId?: string | null;
  itemsCount?: number | null;
  payload?: Record<string, unknown> | null;
}

export interface MiningDraftCardDto {
  draftId: string;
  sentence: string;
  targetWord: string;
  translation: string;
  termText: string;
  confidence: number;
}

export interface ZeroTouchMiningRequestDto {
  projectId: string;
  sourceText: string;
  sourceTitle?: string | null;
}

export interface ZeroTouchMiningResponseDto {
  projectId: string;
  totalDrafts: number;
  drafts: MiningDraftCardDto[];
}

export interface ApproveMiningDraftsRequestDto {
  deckId: string;
  drafts: MiningDraftCardDto[];
}

export interface CopilotReviewFeedbackRequestDto {
  cardId: string;
  sentence: string;
  targetWord: string;
  translation: string;
  userAnswer?: string | null;
  rating: number;
}

export interface CopilotRemedialCardDto {
  sentence: string;
  targetWord: string;
  translation: string;
}

export interface CopilotReviewFeedbackDto {
  tone: string;
  explanation: string;
  actionHint: string;
  suggestRemedialCards: boolean;
  remedialCards: CopilotRemedialCardDto[];
}

export interface ExperimentAssignmentDto {
  key: string;
  variant: string;
}

// Marketplace (ProductDto, SR-SRC-03, SR-MKT-*)
export interface ProductAuthorDto {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
}

export interface ProductDto {
  id: string;
  author: ProductAuthorDto;
  linkedDeckId: string;
  title: string;
  descriptionHtml: string;
  coverImageUrl: string;
  price: number;
  currency: string;
  averageRating: number;
  reviewCount: number;
  salesCount: number;
  isOwned: boolean;
}

/** Отзыв о товаре (ProductReviewDto, SR-MKT-05) */
export interface ProductReviewDto {
  id: string;
  productId: string;
  author: ProductAuthorDto;
  rating: number;
  comment: string;
  isVerifiedPurchase?: boolean;
  authorReply?: string | null;
  createdAt: string;
}

/** Карточка для Smart Preview (CardPreviewDto, SR-MKT-02) */
export interface CardPreviewDto {
  id: string;
  note?: NotePayloadDto | null;
  srsStatus?: string | null;
  hasAudio?: boolean | null;
  deckTitle?: string | null;
}

export interface MarketplaceSearchParams {
  query?: string | null;
  tags?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: "popularity" | "rating" | "newest" | "price_asc" | null;
  pageNumber?: number;
  pageSize?: number;
}

export interface TrackExperimentEventDto {
  key: string;
  variant: string;
  eventName: string;
  projectId?: string | null;
  deckId?: string | null;
}

// Deck subscriptions (IA: /subscriptions)
export interface DeckSubscriptionDto {
  id: string;
  userId: string;
  deckId: string;
  lastSyncedVersion: number;
  subscribedAt: string;
  lastAccessedAt: string;
  deckTitle?: string;
}

export interface IntegrationProviderOptionDto {
  id: string;
  displayName: string;
}

export interface IntegrationProvidersResponseDto {
  translators: IntegrationProviderOptionDto[];
  dictionaries: IntegrationProviderOptionDto[];
}

export interface TranslateRequestDto {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  provider: string;
}

export interface TranslateResponseDto {
  provider: string;
  translatedText: string;
}

export interface DictionaryLookupRequestDto {
  word: string;
  language: string;
  provider: string;
}

export interface DictionaryMeaningDto {
  partOfSpeech: string;
  definitions: string[];
}

export interface DictionaryLookupResponseDto {
  provider: string;
  word: string;
  phonetic?: string | null;
  meanings: DictionaryMeaningDto[];
}

/** Languages supported by PolyGuide / TTS bridge (Sentence Mining pipelines). */
export type CopilotLanguageCode = "en" | "ru" | "ko";

export interface IntegrationLanguageProfile {
  translatorProvider: string;
  dictionaryProvider: string;
}

export interface IntegrationPreferences {
  translatorProvider: string;
  dictionaryProvider: string;
  /** Optional per-language provider overrides (persisted keys: en | ru | ko). */
  profiles?: Partial<Record<CopilotLanguageCode, IntegrationLanguageProfile>>;
}

/** Request to server-side OpenAI-compatible TTS + Media upload */
export interface GenerateAudioRequestDto {
  text: string;
  /** en | ru | ko */
  language: string;
  voice?: string | null;
  speed?: number | null;
}

export interface GenerateAudioResponseDto {
  url: string;
  audioId?: string | null;
  provider: string;
  language: string;
}

// Agent types
export interface AgentThreadListItemDto {
  id: string;
  projectId: string;
  title: string;
  agentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentThreadDto extends AgentThreadListItemDto {
  archivedAt?: string | null;
}

export interface CreateAgentThreadRequestDto {
  projectId: string;
  agentId?: string | null;
  systemPromptOverride?: string | null;
}

export interface AgentMessageDto {
  id: string;
  role: string;
  content: string;
  metadataJson?: string | null;
  createdAt: string;
}

export interface AgentMessageListDto {
  items: AgentMessageDto[];
  nextBefore?: string | null;
}

export interface AgentMessageInputDto {
  id?: string | null;
  role: string;
  content: string;
  metadataJson?: string | null;
}

export interface AgentDomainDecisionDto {
  allowed: boolean;
  category: string;
  reason?: string | null;
}

export interface AgentToolCallDto {
  toolName: string;
  inputJson: string;
  outputJson: string;
  status: string;
}

export interface ExecuteAgentRunRequestDto {
  projectId: string;
  userText: string;
  sourceLang?: string | null;
  targetLang?: string | null;
  firstDeckId?: string | null;
  isInitialGreeting?: boolean;
}

/** @deprecated Server executes runs; kept for backward-compatible typing in tests. */
export interface CreateAgentRunRequestDto {
  projectId: string;
  userMessage: AgentMessageInputDto;
  assistantMessage: AgentMessageInputDto;
  domainDecision: AgentDomainDecisionDto;
  toolCalls: AgentToolCallDto[];
  model?: string | null;
}

export interface AgentRunDto {
  id: string;
  threadId: string;
  status: string;
  model?: string | null;
  startedAt: string;
  completedAt?: string | null;
}

export interface CreateAgentRunResponseDto {
  run: AgentRunDto;
  userMessage: AgentMessageDto;
  assistantMessage: AgentMessageDto;
}

// Lessons Module Types
export interface LessonDto {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  contentMarkdown: string;
  colorCssClass?: string | null;
  cefrLevel: string;
  orderIndex: number;
  unlocksAfterLessonId?: string | null;
  targetSkills: string;
  estimatedMinutes: number;
}

export enum LessonProgressStatus {
  NotStarted = 0,
  InProgress = 1,
  Completed = 2
}

export interface UserLessonProgressDto {
  id: string;
  userId: string;
  lessonId: string;
  status: LessonProgressStatus;
  agentThreadId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface LessonWithProgressDto {
  lesson: LessonDto;
  progress?: UserLessonProgressDto | null;
}

export interface GetLessonsResponse {
  lessons: LessonWithProgressDto[];
}

export interface GetLessonResponse {
  lessonWithProgress: LessonWithProgressDto;
}

export interface StartLessonResponse {
  progress: UserLessonProgressDto;
}

// Admin DTOs
export interface AdminUserDto {
  id: string;
  userName: string;
  email: string;
  registrationDate: string;
  planCode: string;
  isLockedOut: boolean;
}

export interface AdminUsersResponseDto {
  users: AdminUserDto[];
  totalCount: number;
}

export interface AdminUpdatePlanEntitlementsRequestDto {
  entitlements: Record<string, string>;
}

export interface AdminSetLockoutRequestDto {
  lock: boolean;
}

export interface AdminAssignPlanRequestDto {
  planCode: string;
}

export interface AdminUserDetailDto {
  id: string;
  userName: string;
  email: string;
  avatarUrl: string;
  planCode: string;
  isLockedOut: boolean;
  entitlements: Record<string, string>;
  subscription?: any; // Subscription info
}

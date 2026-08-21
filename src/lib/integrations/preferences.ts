import type {
  CopilotLanguageCode,
  IntegrationLanguageProfile,
  IntegrationPreferences,
} from "@/lib/api/types";

const STORAGE_KEY = "integration-preferences-v1";

export const DEFAULT_INTEGRATION_PREFERENCES: IntegrationPreferences = {
  translatorProvider: "mymemory",
  dictionaryProvider: "freedictionary",
};

const COPILOT_LANGS: CopilotLanguageCode[] = ["en", "ru", "ko"];

function seedProfilesFromLegacy(
  translatorProvider: string,
  dictionaryProvider: string
): Record<CopilotLanguageCode, IntegrationLanguageProfile> {
  const row = { translatorProvider, dictionaryProvider };
  return { en: { ...row }, ru: { ...row }, ko: { ...row } };
}

function normalizePreferences(parsed: Partial<IntegrationPreferences>): IntegrationPreferences {
  const translatorProvider =
    parsed.translatorProvider?.trim() ||
    DEFAULT_INTEGRATION_PREFERENCES.translatorProvider;
  const dictionaryProvider =
    parsed.dictionaryProvider?.trim() ||
    DEFAULT_INTEGRATION_PREFERENCES.dictionaryProvider;

  const seeded = seedProfilesFromLegacy(translatorProvider, dictionaryProvider);

  const merged: Record<CopilotLanguageCode, IntegrationLanguageProfile> = {
    en: parsed.profiles?.en ?? seeded.en,
    ru: parsed.profiles?.ru ?? seeded.ru,
    ko: parsed.profiles?.ko ?? seeded.ko,
  };

  return {
    translatorProvider,
    dictionaryProvider,
    profiles: merged,
  };
}

/** BCP-47 short code → PolyGuide language (en | ru | ko). */
export function resolveCopilotLanguage(languageCode: string | undefined | null): CopilotLanguageCode {
  const l = (languageCode ?? "en").trim().toLowerCase();
  const two = l.slice(0, 2);
  return (COPILOT_LANGS as readonly string[]).includes(two) ? (two as CopilotLanguageCode) : "en";
}

/** Effective translator + dictionary providers for a study language hint. */
export function getEffectiveIntegrationLanguageProfile(
  prefs: IntegrationPreferences,
  studyLanguageCode: string | undefined | null
): IntegrationLanguageProfile {
  const lang = resolveCopilotLanguage(studyLanguageCode);
  const row = prefs.profiles?.[lang];
  if (row) {
    return {
      translatorProvider: row.translatorProvider?.trim() || prefs.translatorProvider,
      dictionaryProvider: row.dictionaryProvider?.trim() || prefs.dictionaryProvider,
    };
  }
  return {
    translatorProvider: prefs.translatorProvider,
    dictionaryProvider: prefs.dictionaryProvider,
  };
}

export function loadIntegrationPreferences(): IntegrationPreferences {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_INTEGRATION_PREFERENCES,
      profiles: seedProfilesFromLegacy(
        DEFAULT_INTEGRATION_PREFERENCES.translatorProvider,
        DEFAULT_INTEGRATION_PREFERENCES.dictionaryProvider
      ),
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizePreferences(DEFAULT_INTEGRATION_PREFERENCES);
    }

    const parsed = JSON.parse(raw) as Partial<IntegrationPreferences>;
    return normalizePreferences(parsed);
  } catch {
    return normalizePreferences(DEFAULT_INTEGRATION_PREFERENCES);
  }
}

export function saveIntegrationPreferences(next: IntegrationPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizePreferences(next);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

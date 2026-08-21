import { describe, expect, it } from "vitest";
import { getEffectiveIntegrationLanguageProfile, resolveCopilotLanguage } from "@/lib/integrations/preferences";
import type { IntegrationPreferences } from "@/lib/api/types";

describe("resolveCopilotLanguage", () => {
  it("maps BCP-47 to en, ru, ko", () => {
    expect(resolveCopilotLanguage("en-US")).toBe("en");
    expect(resolveCopilotLanguage("KO")).toBe("ko");
    expect(resolveCopilotLanguage("ru-RU")).toBe("ru");
  });

  it("falls back to en for unknown codes", () => {
    expect(resolveCopilotLanguage("de")).toBe("en");
    expect(resolveCopilotLanguage("")).toBe("en");
    expect(resolveCopilotLanguage(null)).toBe("en");
  });
});

describe("getEffectiveIntegrationLanguageProfile", () => {
  it("uses per-language profiles when present", () => {
    const prefs: IntegrationPreferences = {
      translatorProvider: "mymemory",
      dictionaryProvider: "freedictionary",
      profiles: {
        en: { translatorProvider: "a", dictionaryProvider: "b" },
        ru: { translatorProvider: "ru-t", dictionaryProvider: "ru-d" },
        ko: { translatorProvider: "ko-t", dictionaryProvider: "ko-d" },
      },
    };
    expect(getEffectiveIntegrationLanguageProfile(prefs, "ko")).toEqual({
      translatorProvider: "ko-t",
      dictionaryProvider: "ko-d",
    });
  });

  it("falls back to top-level translator/dictionary providers", () => {
    const prefs: IntegrationPreferences = {
      translatorProvider: "fallback-t",
      dictionaryProvider: "fallback-d",
    };
    expect(getEffectiveIntegrationLanguageProfile(prefs, "en")).toEqual({
      translatorProvider: "fallback-t",
      dictionaryProvider: "fallback-d",
    });
  });
});

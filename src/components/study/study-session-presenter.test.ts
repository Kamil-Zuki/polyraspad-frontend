import { describe, expect, it } from "vitest";
import { formatStudyIntervals, toStudyCardViewModel } from "./study-session-presenter";
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys";

describe("study-session-presenter", () => {
  it("normalizes FSRS interval labels for rating buttons", () => {
    expect(
      formatStudyIntervals({
        1: "1 minute",
        2: "1440 minutes",
        3: "14400 minutes",
        4: "525600 minutes",
      })
    ).toEqual({
      1: "1m",
      2: "1d",
      3: "10d",
      4: "1y",
    });
  });

  it("maps study cards to a view model with image and source metadata", () => {
    const result = toStudyCardViewModel({
      id: "card-1",
      type: "SENTENCE_MINING",
      content: {
        note: {
          id: "note-1",
          noteTypeId: "nt-1",
          fieldValues: {
            Expression: { stringValue: "Success is not final, failure is not fatal." },
            Word: { stringValue: "fatal" },
            Translation: { stringValue: "Успех не окончателен, неудача не смертельна." },
          },
        },
        targetIndex: { start: 37, len: 5 },
      },
      sourceMeta: {
        type: "youtube",
        title: "TED Talk",
        timestamp: 765,
        url: "https://youtube.com/watch?v=123",
      },
      media: {
        imageId: "img-1",
        imageUrl: "https://cdn.example.com/fatal.jpg",
      },
      srsState: {
        state: "REVIEW",
        currentInterval: 4,
      },
      nextIntervals: {
        1: "1m",
        2: "2d",
        3: "5d",
        4: "14d",
      },
      siblingsCount: 0,
    });

    expect(result.targetWord).toBe("fatal");
    expect(result.highlightRange).toEqual({ start: 37, len: 5 });
    expect(result.backSections.map((s) => s.label)).toEqual(expect.arrayContaining(["Translation"]));
    const tr = result.backSections.find((s) => s.key === SENTENCE_MINING.Translation);
    expect(tr?.value).toBe("Успех не окончателен, неудача не смертельна.");
    expect(result.sourceTitle).toBe("TED Talk");
    expect(result.sourceTimestamp).toBe("12:45");
    expect(result.imageSrc).toContain("/api/Media/serve-image?id=img-1");
    expect(result.imageFallbackSrc).toBe("https://cdn.example.com/fatal.jpg");
  });

  it("maps web / reader source metadata to article source type for study UI", () => {
    const result = toStudyCardViewModel({
      id: "card-2",
      type: "SENTENCE_MINING",
      content: {
        note: {
          id: "note-2",
          noteTypeId: "nt-1",
          fieldValues: {
            Expression: { stringValue: "The cat sat." },
            Word: { stringValue: "cat" },
            Translation: { stringValue: "Кот сидел." },
            Transcription: { stringValue: "/kæt/" },
            Definition: { stringValue: "(noun) Feline." },
            Audio: { stringValue: "https://example.com/meow.mp3" },
          },
        },
        targetIndex: { start: 4, len: 3 },
      },
      sourceMeta: {
        type: "web",
        title: "Reader lesson",
        url: "https://example.com/lesson",
      },
      media: {},
      srsState: { state: "NEW", currentInterval: 0 },
      nextIntervals: { 1: "1m", 2: "2d", 3: "4d", 4: "14d" },
      siblingsCount: 0,
    });

    expect(result.sourceType).toBe("article");
    expect(result.sourceTitle).toBe("Reader lesson");
    expect(result.sourceUrl).toBe("https://example.com/lesson");
    expect(result.highlightRange).toEqual({ start: 4, len: 3 });
    expect(result.backSections.some((s) => s.key === SENTENCE_MINING.Transcription)).toBe(true);
    expect(result.backSections.some((s) => s.key === SENTENCE_MINING.Definition)).toBe(true);
    expect(result.audioSrc).toBe("https://example.com/meow.mp3");
  });
});

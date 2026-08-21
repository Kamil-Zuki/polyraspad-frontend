import type { CardStudyDto } from "@/lib/api/types";
import { resolvePublicApiBaseUrl } from "@/lib/api/public-api-url";
import { getPreviewImageSrc } from "@/lib/utils/media-preview-url";
import { noteFieldPlainString } from "@/lib/editor/card-display";
import { sentenceMiningStudyBackSections } from "@/lib/editor/sentence-mining-display";
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys";
import { sanitizeSourceUrl } from "@/app/reader/reader-utils";
import type { StudyCardProps } from "./study-card";

const API_BASE_URL = resolvePublicApiBaseUrl();

function mapStudySourceType(
  meta: CardStudyDto["sourceMeta"]
): StudyCardProps["sourceType"] | undefined {
  if (!meta) return undefined;
  const t = (meta.type ?? "").trim().toLowerCase();
  if (t === "youtube") return "youtube";
  if (t === "book") return "book";
  const hasLabel = Boolean(meta.title?.trim()) || Boolean(meta.url?.trim());
  if (hasLabel) return "article";
  return undefined;
}

type StudyCardViewModel = Omit<StudyCardProps, "isRevealed" | "onReveal">;

function sliceHighlightRange(
  sentence: string,
  targetIndex: CardStudyDto["content"]["targetIndex"]
): { start: number; len: number } | undefined {
  if (!targetIndex || targetIndex.len <= 0) return undefined;
  const start = targetIndex.start;
  const len = targetIndex.len;
  if (start < 0 || start + len > sentence.length) return undefined;
  return { start, len };
}

function formatSourceTimestamp(seconds?: number | null) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return undefined;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatStudyInterval(value?: string) {
  if (!value) return "";

  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";

  const compact = normalized.match(
    /^(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks|mo|month|months|y|yr|yrs|year|years)$/i
  );

  if (compact) {
    const [, amount, unit] = compact;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return normalized.replace(/\s+/g, " ");

    let minutes: number;
    if (/^(m|min|mins|minute|minutes)$/i.test(unit)) minutes = numericAmount;
    else if (/^(h|hr|hrs|hour|hours)$/i.test(unit)) minutes = numericAmount * 60;
    else if (/^(d|day|days)$/i.test(unit)) minutes = numericAmount * 1440;
    else if (/^(w|week|weeks)$/i.test(unit)) minutes = numericAmount * 7 * 1440;
    else if (/^(mo|month|months)$/i.test(unit)) minutes = numericAmount * 30 * 1440;
    else minutes = numericAmount * 365 * 1440;

    const formatAmount = (n: number) => {
      const rounded = Math.round(n * 10) / 10;
      return Number.isInteger(rounded) ? String(rounded) : String(rounded);
    };

    if (minutes < 60) return `${formatAmount(minutes)}m`;
    if (minutes < 1440) return `${formatAmount(minutes / 60)}h`;
    if (minutes < 365 * 1440) return `${formatAmount(minutes / 1440)}d`;
    return `${formatAmount(minutes / (365 * 1440))}y`;
  }

  return normalized.replace(/\s+/g, " ");
}

export function formatStudyIntervals(intervals?: Record<number, string>) {
  if (!intervals) return undefined;

  return Object.fromEntries(
    Object.entries(intervals).map(([rating, value]) => [Number(rating), formatStudyInterval(value)])
  ) as Record<number, string>;
}

export function toStudyCardViewModel(card: CardStudyDto): StudyCardViewModel {
  const { content, srsState } = card;
  const fv = content.note?.fieldValues;
  const sentence = noteFieldPlainString(fv, SENTENCE_MINING.Expression);
  const wordField = noteFieldPlainString(fv, SENTENCE_MINING.Word);
  const targetWord =
    sentence.slice(content.targetIndex.start, content.targetIndex.start + content.targetIndex.len) ||
    wordField ||
    "";

  const highlightRange = sliceHighlightRange(sentence, content.targetIndex);
  const audioFromNote = noteFieldPlainString(fv, SENTENCE_MINING.Audio)?.trim();

  return {
    sentence,
    targetWord,
    highlightRange,
    backSections: sentenceMiningStudyBackSections(fv),
    sourceType: mapStudySourceType(card.sourceMeta),
    sourceTitle: card.sourceMeta?.title ?? undefined,
    sourceTimestamp: formatSourceTimestamp(card.sourceMeta?.timestamp),
    sourceUrl: sanitizeSourceUrl(card.sourceMeta?.url ?? undefined) || undefined,
    imageSrc: getPreviewImageSrc({
      imageId: card.media?.imageId ?? undefined,
      imageUrl: card.media?.imageUrl ?? undefined,
      apiBaseUrl: API_BASE_URL,
    }),
    imageFallbackSrc: card.media?.imageUrl ?? undefined,
    audioSrc: card.media?.audioUrl?.trim() || audioFromNote || undefined,
    srsState: { state: srsState.state, currentInterval: srsState.currentInterval },
  };
}

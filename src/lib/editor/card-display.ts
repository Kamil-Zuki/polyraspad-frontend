import type { CardPreviewDto, CardResponseDto, NoteFieldValueDto } from "@/lib/api/types"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

export function noteFieldPlainString(
  fv: Record<string, NoteFieldValueDto> | undefined,
  key: string
): string {
  if (!fv) return ""
  const v = fv[key]
  if (!v) return ""
  if (v.stringValues?.length) return v.stringValues.join(", ")
  return (v.stringValue ?? "").trim()
}

/** Превью списка карточек / поиска: текст из note.fieldValues. */
export function cardListPrimaryLine(card: CardResponseDto): string {
  const fv = card.note?.fieldValues
  const expr = noteFieldPlainString(fv, SENTENCE_MINING.Expression)
  if (expr) return expr
  return noteFieldPlainString(fv, SENTENCE_MINING.Word)
}

export function cardListWord(card: CardResponseDto): string {
  return noteFieldPlainString(card.note?.fieldValues, SENTENCE_MINING.Word)
}

/** Превью дубликатов / связанных карточек (только `note` с сервера). */
export function cardPreviewExpression(card: CardPreviewDto): string {
  return noteFieldPlainString(card.note?.fieldValues, SENTENCE_MINING.Expression)
}

export function cardPreviewWord(card: CardPreviewDto): string {
  return noteFieldPlainString(card.note?.fieldValues, SENTENCE_MINING.Word)
}

export function cardPreviewTranslation(card: CardPreviewDto): string {
  return noteFieldPlainString(card.note?.fieldValues, SENTENCE_MINING.Translation)
}

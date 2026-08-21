import type { CreateCardDto, NoteFieldValueDto, NotePayloadDto, UpdateCardDto } from "@/lib/api/types"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

function parseSynonymsLine(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function stringToNoteFieldDto(key: string, raw: string | undefined): NoteFieldValueDto {
  if (key === SENTENCE_MINING.Synonyms) {
    const arr = parseSynonymsLine(raw ?? "")
    return { stringValues: arr }
  }
  const s = (raw ?? "").trim()
  return { stringValue: s }
}

/**
 * Строковая карта редактора → `fieldValues` для POST /api/Cards (Aggregator CreateCardDto).
 */
export function fieldValuesToCreateCardDto(
  fv: Record<string, string>,
  deckId: string,
  opts?: {
    imageId?: string | null
    imageUrl?: string | null
    audioUrl?: string | null
  }
): CreateCardDto {
  const fieldValues: Record<string, NoteFieldValueDto> = {}

  for (const key of Object.keys(fv)) {
    fieldValues[key] = stringToNoteFieldDto(key, fv[key])
  }

  const imageFromField = (fv[SENTENCE_MINING.Image] ?? "").trim()
  const audioFromField = (fv[SENTENCE_MINING.Audio] ?? "").trim()
  const imageUrl = (opts?.imageUrl?.trim() || imageFromField) || undefined
  const audioUrl = (opts?.audioUrl?.trim() || audioFromField) || undefined

  if (opts?.imageId) {
    fieldValues[SENTENCE_MINING.Image] = { stringValue: opts.imageId }
  } else if (imageUrl !== undefined) {
    fieldValues[SENTENCE_MINING.Image] = { stringValue: imageUrl }
  } else if (imageFromField !== "") {
    fieldValues[SENTENCE_MINING.Image] = { stringValue: imageFromField }
  }

  if (opts?.audioUrl) {
    fieldValues[SENTENCE_MINING.Audio] = { stringValue: opts.audioUrl }
  } else if (audioUrl !== undefined) {
    fieldValues[SENTENCE_MINING.Audio] = { stringValue: audioUrl }
  } else if (audioFromField !== "") {
    fieldValues[SENTENCE_MINING.Audio] = { stringValue: audioFromField }
  }

  return { deckId, fieldValues }
}

export function fieldValuesToUpdateCardDto(
  fv: Record<string, string>,
  opts?: {
    imageId?: string | null
    imageUrl?: string | null
    audioUrl?: string | null
  }
): UpdateCardDto {
  const fieldValues: Record<string, NoteFieldValueDto> = {}
  for (const key of Object.keys(fv)) {
    fieldValues[key] = stringToNoteFieldDto(key, fv[key])
  }

  const imageFromField = (fv[SENTENCE_MINING.Image] ?? "").trim()
  const audioFromField = (fv[SENTENCE_MINING.Audio] ?? "").trim()
  
  if (opts?.imageId) {
    fieldValues[SENTENCE_MINING.Image] = { stringValue: opts.imageId }
  } else if (opts?.imageUrl !== undefined) {
    fieldValues[SENTENCE_MINING.Image] = { stringValue: opts.imageUrl }
  } else {
    fieldValues[SENTENCE_MINING.Image] = { stringValue: imageFromField }
  }

  if (opts?.audioUrl !== undefined) {
    fieldValues[SENTENCE_MINING.Audio] = { stringValue: opts.audioUrl }
  } else {
    fieldValues[SENTENCE_MINING.Audio] = { stringValue: audioFromField }
  }

  return { fieldValues }
}

/** Overlay `card.note.fieldValues` (REST) onto a string map for the editor. */
export function notePayloadToFieldStrings(note: NotePayloadDto | null | undefined): Record<string, string> {
  if (!note?.fieldValues) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(note.fieldValues)) {
    const sv = v.stringValue?.trim()
    if (sv) {
      out[k] = sv
      continue
    }
    if (v.stringValues?.length) {
      out[k] = v.stringValues.join(", ")
    }
  }
  return out
}

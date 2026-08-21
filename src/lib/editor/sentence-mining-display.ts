import type { NoteFieldValueDto } from "@/lib/api/types"
import { noteFieldPlainString } from "@/lib/editor/card-display"
import {
  SENTENCE_MINING,
  type SentenceMiningFieldKey,
} from "@/lib/editor/sentence-mining-keys"

/** UI row for Study / Reader full-field layouts (English labels match existing editor conventions). */
export interface SentenceMiningStudySection {
  readonly key: SentenceMiningFieldKey
  readonly label: string
  readonly value: string
}

/** Primary back rows in display order (mirrors mining card mock). */
const BACK_ROWS: readonly { key: SentenceMiningFieldKey; label: string }[] = [
  { key: SENTENCE_MINING.Word, label: "Word" },
  { key: SENTENCE_MINING.Transcription, label: "Transcription" },
  { key: SENTENCE_MINING.WordTypes, label: "Word types" },
  { key: SENTENCE_MINING.Translation, label: "Translation" },
  { key: SENTENCE_MINING.Definition, label: "Definition" },
  { key: SENTENCE_MINING.Example, label: "Example" },
  { key: SENTENCE_MINING.Synonyms, label: "Synonyms" },
  { key: SENTENCE_MINING.Antonyms, label: "Antonyms" },
  { key: SENTENCE_MINING.Notes, label: "Notes" },
]

/** Optional source metadata stored on the note (shown when non-empty). */
const SOURCE_ROWS: readonly { key: SentenceMiningFieldKey; label: string }[] = [
  { key: SENTENCE_MINING.SourceTitle, label: "Source title" },
  { key: SENTENCE_MINING.SourceUrl, label: "Source URL" },
]

function buildBackSectionsFromStrings(
  fieldValues: Record<string, string | undefined | null> | undefined
): SentenceMiningStudySection[] {
  if (!fieldValues) return []
  const sections: SentenceMiningStudySection[] = []
  for (const { key, label } of BACK_ROWS) {
    const value = (fieldValues[key] ?? "").trim()
    if (value) sections.push({ key, label, value })
  }
  for (const { key, label } of SOURCE_ROWS) {
    const value = (fieldValues[key] ?? "").trim()
    if (value) sections.push({ key, label, value })
  }
  return sections
}

export function sentenceMiningEditorBackSections(
  fieldValues: Record<string, string | undefined | null> | undefined
): SentenceMiningStudySection[] {
  return buildBackSectionsFromStrings(fieldValues)
}

export function sentenceMiningStudyBackSections(
  fieldValues: Record<string, NoteFieldValueDto> | undefined
): SentenceMiningStudySection[] {
  if (!fieldValues) return []
  const flat: Record<string, string> = {}
  for (const { key } of [...BACK_ROWS, ...SOURCE_ROWS]) {
    const value = noteFieldPlainString(fieldValues, key)
    if (value) flat[key] = value
  }
  return buildBackSectionsFromStrings(flat)
}
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"

export type CardFieldPatch = Record<string, string>

export interface CardFieldDiffEntry {
  existing: string
  proposed: string
}

export type CardFieldDiff = Record<string, CardFieldDiffEntry>

export const CARD_FIELD_LABELS: Record<string, string> = {
  [SENTENCE_MINING.Expression]: "Expression",
  [SENTENCE_MINING.Word]: "Word",
  [SENTENCE_MINING.Translation]: "Translation",
  [SENTENCE_MINING.Transcription]: "Transcription",
  [SENTENCE_MINING.WordTypes]: "Word types",
  [SENTENCE_MINING.Definition]: "Definition",
  [SENTENCE_MINING.Example]: "Example",
  [SENTENCE_MINING.Synonyms]: "Synonyms",
  [SENTENCE_MINING.Antonyms]: "Antonyms",
  [SENTENCE_MINING.Notes]: "Notes",
  [SENTENCE_MINING.Image]: "Image",
  [SENTENCE_MINING.Audio]: "Audio",
}

export function labelForFieldKey(fieldKey: string): string {
  return CARD_FIELD_LABELS[fieldKey] ?? fieldKey
}

/** Merge patch into current values without overwriting non-empty user fields unless forced. */
export function mergeCardFieldPatch(
  current: Record<string, string>,
  patch: CardFieldPatch,
  options?: { force?: boolean },
): Record<string, string> {
  const force = options?.force ?? false
  const next = { ...current }
  for (const [key, value] of Object.entries(patch)) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const existing = (current[key] ?? "").trim()
    if (!force && existing) continue
    next[key] = trimmed
  }
  return next
}

/** Proposed changes that differ from current values, including existing text for diff UI. */
export function diffCardFieldPatch(
  current: Record<string, string>,
  patch: CardFieldPatch,
): CardFieldDiff {
  const diff: CardFieldDiff = {}
  for (const [key, value] of Object.entries(patch)) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const existing = (current[key] ?? "").trim()
    if (existing === trimmed) continue
    diff[key] = { existing, proposed: trimmed }
  }
  return diff
}

/** Split a patch into values that can be applied directly (empty current) and values that would overwrite. */
export function partitionPatch(
  current: Record<string, string>,
  patch: CardFieldPatch,
): { applied: CardFieldPatch; staged: CardFieldPatch } {
  const applied: CardFieldPatch = {}
  const staged: CardFieldPatch = {}
  for (const [key, value] of Object.entries(patch)) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const existing = (current[key] ?? "").trim()
    if (existing) {
      staged[key] = trimmed
    } else {
      applied[key] = trimmed
    }
  }
  return { applied, staged }
}

export interface CardStatusItem {
  fieldKey: string
  label: string
  required: boolean
  filled: boolean
}

export function buildCardStatus(fieldValues: Record<string, string>): {
  requiredMissing: CardStatusItem[]
  optionalMissing: CardStatusItem[]
} {
  const required: CardStatusItem[] = [
    {
      fieldKey: SENTENCE_MINING.Expression,
      label: labelForFieldKey(SENTENCE_MINING.Expression),
      required: true,
      filled: Boolean(fieldValues[SENTENCE_MINING.Expression]?.trim()),
    },
    {
      fieldKey: SENTENCE_MINING.Word,
      label: labelForFieldKey(SENTENCE_MINING.Word),
      required: true,
      filled: Boolean(fieldValues[SENTENCE_MINING.Word]?.trim()),
    },
    {
      fieldKey: SENTENCE_MINING.Translation,
      label: labelForFieldKey(SENTENCE_MINING.Translation),
      required: true,
      filled: Boolean(fieldValues[SENTENCE_MINING.Translation]?.trim()),
    },
  ]

  const optional: CardStatusItem[] = [
    SENTENCE_MINING.Definition,
    SENTENCE_MINING.Example,
    SENTENCE_MINING.Notes,
    SENTENCE_MINING.Audio,
    SENTENCE_MINING.Transcription,
    SENTENCE_MINING.Synonyms,
  ].map((fieldKey) => ({
    fieldKey,
    label: labelForFieldKey(fieldKey),
    required: false,
    filled: Boolean(fieldValues[fieldKey]?.trim()),
  }))

  return {
    requiredMissing: required.filter((r) => !r.filled),
    optionalMissing: optional.filter((r) => !r.filled),
  }
}

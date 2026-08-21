/** Stable field keys for the default "Sentence Mining" note type (parity with VocabularyService.Domain.SentenceMiningNoteType). */
export const SENTENCE_MINING = {
  Expression: "Expression",
  Word: "Word",
  Translation: "Translation",
  Transcription: "Transcription",
  WordTypes: "WordTypes",
  Definition: "Definition",
  Example: "Example",
  Synonyms: "Synonyms",
  Antonyms: "Antonyms",
  Notes: "Notes",
  SourceTitle: "SourceTitle",
  SourceUrl: "SourceUrl",
  Image: "Image",
  Audio: "Audio",
} as const

export type SentenceMiningFieldKey = (typeof SENTENCE_MINING)[keyof typeof SENTENCE_MINING]

/** Default Anki-style templates when API did not return `activeCardTemplate` yet. */
export const DEFAULT_SENTENCE_MINING_TEMPLATES = {
  front: "{{Expression}}",
  back:
    "{{Word}}\n\n{{Translation}}\n\n{{Definition}}\n\n{{Example}}\n\n{{Synonyms}}\n\n{{Antonyms}}\n\n{{Notes}}",
} as const

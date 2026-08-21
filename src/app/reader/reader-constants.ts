export const READER_PAGE_CHARACTER_LIMIT = 1500

/** localStorage: mark remaining blue words known on page turn */
export const READER_MARK_KNOWN_PAGE_TURN_KEY = "polyraspad.reader.markKnownOnPageTurn"

/** localStorage: PDF split pane left column ratio (0.35–0.85) */
export const READER_PDF_SPLIT_RATIO_KEY = "polyraspad.reader.pdfSplitRatio"

/** localStorage: reading surface theme */
export const READER_READING_THEME_KEY = "polyraspad.reader.readingTheme"

/** localStorage: book style typography toggle (serif, justification, indents) */
export const READER_BOOK_STYLE_KEY = "polyraspad.reader.bookStyle"


/** localStorage: last read page per book (fallback when API save fails or shared books) */
export function readerProgressLocalKey(bookId: string): string {
  return `polyraspad.reader.lastPage.${bookId}`
}

export const ALL_COLLECTION_ID = "__all__"
export const UNSORTED_COLLECTION_ID = "__unsorted__"

export function isPersistedReaderCollectionId(id: string): boolean {
  return (
    id !== ALL_COLLECTION_ID &&
    id !== UNSORTED_COLLECTION_ID &&
    !id.startsWith("__draft__:")
  )
}

/** sessionStorage key for manual text passed from /library to /reader */


export function normalizeReaderSearchQuery(search: string): string {
  if (!search) return ""
  const params = new URLSearchParams(search)
  const sortedKeys = [...new Set([...params.keys()])].sort()
  const normalized = new URLSearchParams()
  for (const key of sortedKeys) {
    const value = params.get(key)
    if (value != null) normalized.set(key, value)
  }
  return normalized.toString()
}

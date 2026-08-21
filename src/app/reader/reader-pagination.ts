import type { TextTokenDto } from "@/lib/api/types"

import { READER_PAGE_CHARACTER_LIMIT } from "@/app/reader/reader-constants"

export interface ReaderPageSlice {
  pageNumber: number
  tokenIndexes: number[]
}

export function buildReaderPages(tokens: TextTokenDto[]): ReaderPageSlice[] {
  if (tokens.length === 0) return []

  const pages: ReaderPageSlice[] = []
  let currentIndexes: number[] = []
  let currentLength = 0

  const flushPage = () => {
    if (currentIndexes.length === 0) return

    pages.push({
      pageNumber: pages.length + 1,
      tokenIndexes: currentIndexes,
    })
    currentIndexes = []
    currentLength = 0
  }

  tokens.forEach((token, index) => {
    const tokenLength = token.text.length

    currentIndexes.push(index)
    currentLength += tokenLength

    const shouldBreakOnSentence =
      currentLength >= READER_PAGE_CHARACTER_LIMIT && token.type === "PUNCTUATION" && /[.!?]/.test(token.text)

    const shouldBreakOnParagraph =
      currentLength >= READER_PAGE_CHARACTER_LIMIT * 0.7 && token.type === "SPACE" && /\n{2,}/.test(token.text)

    if (shouldBreakOnSentence || shouldBreakOnParagraph) {
      flushPage()
    }
  })

  flushPage()

  return pages
}

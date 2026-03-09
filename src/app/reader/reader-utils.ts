import type { TextTokenDto, TextAnalyzeResponseDto, TextTokenStatus } from "@/lib/api/types"

export function getTokenStatusClass(status: TextTokenStatus | undefined | null): string {
  switch (status) {
    case "NEW":
      return "bg-cyan-500/20 text-cyan-300 border-b border-cyan-400/50 cursor-pointer hover:bg-cyan-500/30 rounded px-0.5"
    case "LEARNING":
      return "bg-amber-500/20 text-amber-300 border-b border-amber-400/50 cursor-pointer hover:bg-amber-500/30 rounded px-0.5"
    case "KNOWN":
      return "text-gray-300"
    default:
      return "text-gray-400"
  }
}

/** Client-side fallback when /text/analyze API is not available: split into words/spaces/punctuation, all words NEW */
export function clientSideTokenize(text: string): TextAnalyzeResponseDto {
  const tokens: TextTokenDto[] = []
  const re = /(\s+|[^\s\w]+|\w+)/g
  let m: RegExpExecArray | null
  let wordCount = 0
  while ((m = re.exec(text)) !== null) {
    const t = m[0]
    if (/^\s+$/.test(t)) {
      tokens.push({ text: t, type: "SPACE", status: "NONE" })
    } else if (/^\w+$/.test(t)) {
      wordCount++
      tokens.push({ text: t, lemma: t.toLowerCase(), status: "NEW", type: "WORD" })
    } else {
      tokens.push({ text: t, type: "PUNCTUATION", status: "NONE" })
    }
  }
  return {
    tokens,
    stats: {
      uniqueWords: wordCount,
      knownPercentage: 0,
    },
  }
}

export function extractSentenceFromTokens(
  tokens: TextTokenDto[],
  wordIndex: number
): string {
  const isSentenceEnd = (t: TextTokenDto) =>
    t.type === "PUNCTUATION" && /[.!?]/.test(t.text)
  let start = wordIndex
  while (start > 0) {
    start--
    if (isSentenceEnd(tokens[start])) {
      start++
      break
    }
  }
  let end = wordIndex
  while (end < tokens.length - 1) {
    end++
    if (isSentenceEnd(tokens[end])) break
  }
  return tokens
    .slice(start, end + 1)
    .map((t) => t.text)
    .join("")
}

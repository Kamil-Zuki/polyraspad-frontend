import { ollamaGenerate } from "@/lib/api/ollama-client"
import type { CardFieldPatch } from "@/lib/editor/card-field-patch"
import { buildCardStatus } from "@/lib/editor/card-field-patch"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { presetLabelForCode } from "@/lib/languages/study-language-preferences"

function languageLabel(code: string) {
  return presetLabelForCode(code)
}

function pickLine(response: string, prefix: string): string {
  const line = response
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.toUpperCase().startsWith(prefix.toUpperCase()))
  if (!line) return ""
  return line.slice(line.indexOf(":") + 1).trim()
}

export interface AgentContext {
  fieldValues: Record<string, string>
  sourceLang: string
  targetLang: string
  ollamaModel: string
  translateWithTranslator: (options?: { proposeOnly?: boolean }) => Promise<CardFieldPatch | null>
  lookupDictionary: (wordOverride?: string, options?: { proposeOnly?: boolean }) => Promise<CardFieldPatch | null>
  generateCardAudio: (options?: { proposeOnly?: boolean }) => Promise<CardFieldPatch | null>
}

function isWeakFieldValue(value: string | undefined): boolean {
  const t = (value ?? "").trim()
  return !t || t.length < 8
}

/** Deterministic agent: basic tools first, then AI for explanation/polish fields. */
export async function runBuildCardAgent(ctx: AgentContext): Promise<CardFieldPatch> {
  const patch: CardFieldPatch = {}
  const sentence = ctx.fieldValues[SENTENCE_MINING.Expression]?.trim() ?? ""
  const word = ctx.fieldValues[SENTENCE_MINING.Word]?.trim() ?? ""
  const status = buildCardStatus(ctx.fieldValues)

  if (!word) {
    throw new Error("Enter a target word or phrase first.")
  }

  if (!ctx.fieldValues[SENTENCE_MINING.Translation]?.trim() && sentence) {
    const t = await ctx.translateWithTranslator({ proposeOnly: true })
    if (t) Object.assign(patch, t)
  }

  if (!ctx.fieldValues[SENTENCE_MINING.Definition]?.trim()) {
    const d = await ctx.lookupDictionary(word, { proposeOnly: true })
    if (d) Object.assign(patch, d)
  }

  const studyName = languageLabel(ctx.sourceLang)
  const explainName = languageLabel(ctx.targetLang)
  const ctxTranslation = (patch[SENTENCE_MINING.Translation] ?? ctx.fieldValues[SENTENCE_MINING.Translation] ?? "").trim()

  const missingAi: string[] = []
  if (!ctx.fieldValues[SENTENCE_MINING.Example]?.trim() && !patch[SENTENCE_MINING.Example]) missingAi.push("EXAMPLE")
  if (!ctx.fieldValues[SENTENCE_MINING.Notes]?.trim() && !patch[SENTENCE_MINING.Notes]) missingAi.push("NOTES")
  if (!ctx.fieldValues[SENTENCE_MINING.Synonyms]?.trim() && !patch[SENTENCE_MINING.Synonyms]) missingAi.push("SYNONYMS")

  if (missingAi.length > 0 && process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true") {
    const response = await ollamaGenerate({
      prompt: `You help build ${studyName}→${explainName} vocabulary flashcards. Target surface form (exact): "${word}"
${sentence ? `Context sentence (${studyName}): ${sentence}` : ""}
${ctxTranslation ? `Learner gloss (${explainName}): ${ctxTranslation}` : ""}

Output EXACTLY these lines and nothing else — no markdown, no quotes:
${missingAi.includes("EXAMPLE") ? `EXAMPLE_SENTENCE (${studyName}): ...\nEXAMPLE_TRANSLATION (${explainName}): ...\n` : ""}${missingAi.includes("SYNONYMS") ? "SYNONYMS: comma-separated\n" : ""}${missingAi.includes("NOTES") ? `NOTES (${explainName}): usage + grammar hints\n` : ""}
Do not output lemma labels. Do not restate the prompt.`,
      model: ctx.ollamaModel,
      stream: false,
    })

    const exS = pickLine(response, "EXAMPLE_SENTENCE")
    const exT = pickLine(response, "EXAMPLE_TRANSLATION")
    const syns = pickLine(response, "SYNONYMS")
    const n = pickLine(response, "NOTES")

    if (exS && exT && missingAi.includes("EXAMPLE")) {
      const srcTag = ctx.sourceLang.toUpperCase().slice(0, 2)
      const tgtTag = ctx.targetLang.toUpperCase().slice(0, 2)
      patch[SENTENCE_MINING.Example] = `${srcTag}: ${exS}\n${tgtTag}: ${exT}`
    }
    if (syns && !/^n\/a$/i.test(syns) && missingAi.includes("SYNONYMS")) {
      patch[SENTENCE_MINING.Synonyms] = syns
    }
    if (n && !/^n\/a$/i.test(n) && missingAi.includes("NOTES")) {
      patch[SENTENCE_MINING.Notes] = n
    }
  }

  if (!ctx.fieldValues[SENTENCE_MINING.Audio]?.trim() && !patch[SENTENCE_MINING.Audio] && process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true") {
    const a = await ctx.generateCardAudio({ proposeOnly: true })
    if (a) Object.assign(patch, a)
  }

  if (Object.keys(patch).length === 0 && status.requiredMissing.length > 0) {
    throw new Error(`Still missing: ${status.requiredMissing.map((r) => r.label).join(", ")}`)
  }

  return patch
}

/** Improve only empty or weak optional fields. */
export async function runImproveCardAgent(ctx: AgentContext): Promise<CardFieldPatch> {
  const word = ctx.fieldValues[SENTENCE_MINING.Word]?.trim() ?? ""
  if (!word) throw new Error("Enter a target word or phrase first.")

  const patch: CardFieldPatch = {}
  const sentence = ctx.fieldValues[SENTENCE_MINING.Expression]?.trim() ?? ""
  const studyName = languageLabel(ctx.sourceLang)
  const explainName = languageLabel(ctx.targetLang)

  const weak: string[] = []
  if (isWeakFieldValue(ctx.fieldValues[SENTENCE_MINING.Definition])) weak.push("DEFINITION")
  if (isWeakFieldValue(ctx.fieldValues[SENTENCE_MINING.Example])) weak.push("EXAMPLE")
  if (isWeakFieldValue(ctx.fieldValues[SENTENCE_MINING.Notes])) weak.push("NOTES")
  if (isWeakFieldValue(ctx.fieldValues[SENTENCE_MINING.Synonyms])) weak.push("SYNONYMS")
  if (isWeakFieldValue(ctx.fieldValues[SENTENCE_MINING.Translation])) weak.push("TRANSLATION")

  if (weak.includes("TRANSLATION") && sentence) {
    const t = await ctx.translateWithTranslator({ proposeOnly: true })
    if (t) Object.assign(patch, t)
    weak.splice(weak.indexOf("TRANSLATION"), 1)
  }

  if (weak.includes("DEFINITION")) {
    const d = await ctx.lookupDictionary(word, { proposeOnly: true })
    if (d) Object.assign(patch, d)
    weak.splice(weak.indexOf("DEFINITION"), 1)
  }

  if (weak.length === 0 || process.env.NEXT_PUBLIC_FF_AI_AGENTS !== "true") return patch

  const response = await ollamaGenerate({
    prompt: `You improve a ${studyName} flashcard for "${word}".
${sentence ? `Sentence (${studyName}): ${sentence}` : ""}
${(ctx.fieldValues[SENTENCE_MINING.Translation] ?? "").trim() ? `Gloss (${explainName}): ${ctx.fieldValues[SENTENCE_MINING.Translation]?.trim()}` : ""}

The learner still needs concise help for: ${weak.join(", ")}.

Respond EXACTLY with these optional lines (skip a line entirely if unknown):
DEFINITION: ...
SYNONYMS: comma-separated (${studyName})
EXAMPLE_SENTENCE (${studyName}): ...
EXAMPLE_TRANSLATION (${explainName}): ...
NOTES (${explainName}): usage + grammar hints

No markdown, no "Lemma:" labels.`,
    model: ctx.ollamaModel,
    stream: false,
  })

  const def = pickLine(response, "DEFINITION")
  const syn = pickLine(response, "SYNONYMS")
  const exS = pickLine(response, "EXAMPLE_SENTENCE")
  const exT = pickLine(response, "EXAMPLE_TRANSLATION")
  const n = pickLine(response, "NOTES")

  if (def && weak.includes("DEFINITION") && isWeakFieldValue(ctx.fieldValues[SENTENCE_MINING.Definition])) {
    patch[SENTENCE_MINING.Definition] = def
  }
  if (syn && weak.includes("SYNONYMS") && isWeakFieldValue(ctx.fieldValues[SENTENCE_MINING.Synonyms])) {
    patch[SENTENCE_MINING.Synonyms] = syn
  }
  if (exS && exT && weak.includes("EXAMPLE") && isWeakFieldValue(ctx.fieldValues[SENTENCE_MINING.Example])) {
    const srcTag = ctx.sourceLang.toUpperCase().slice(0, 2)
    const tgtTag = ctx.targetLang.toUpperCase().slice(0, 2)
    patch[SENTENCE_MINING.Example] = `${srcTag}: ${exS}\n${tgtTag}: ${exT}`
  }
  if (n && weak.includes("NOTES") && isWeakFieldValue(ctx.fieldValues[SENTENCE_MINING.Notes])) {
    patch[SENTENCE_MINING.Notes] = n
  }

  return patch
}

export async function runExplainWordAgent(
  word: string,
  sentence: string,
  translation: string,
  sourceLang: string,
  targetLang: string,
  ollamaModel: string,
): Promise<string> {
  const studyName = languageLabel(sourceLang)
  const explainName = languageLabel(targetLang)
  const prompt = `You are PolyGuide, a language-learning copilot.
Study language (${studyName}) surface form: "${word}"
${sentence ? `Context sentence (${studyName}): ${sentence}` : ""}
${translation ? `Learner gloss (${explainName}): ${translation}` : ""}

Write 3-5 short sentences in ${explainName} only: core meaning in context, one usage tip, one common mistake.
You may mention a dictionary/base form only as optional reference in passing — never as a status label or "lemma:" line. No markdown.`

  const response = await ollamaGenerate({ prompt, model: ollamaModel, stream: false })
  const trimmed = response.trim()
  if (!trimmed) throw new Error("Empty response.")
  return trimmed
}

export async function runGenerateExampleAgent(
  word: string,
  sourceLang: string,
  targetLang: string,
  ollamaModel: string,
): Promise<{ sentence: string; translation: string }> {
  const studyName = languageLabel(sourceLang)
  const explainName = languageLabel(targetLang)
  const response = await ollamaGenerate({
    prompt: `Generate ONE example sentence in ${studyName} that naturally uses the word or phrase "${word}" (it must appear exactly as shown). Then provide a translation in ${explainName} on the next line.

Format your response EXACTLY like this (nothing else):
SENTENCE: "[your ${studyName} sentence here]"
TRANSLATION: "[your ${explainName} translation here]"`,
    model: ollamaModel,
    stream: false,
  })

  const sentenceMatch = response.match(/SENTENCE:\s*"([^"]+)"/i)
  const translationMatch = response.match(/TRANSLATION:\s*"([^"]+)"/i)
  const s = sentenceMatch?.[1]?.trim()
  const t = translationMatch?.[1]?.trim()
  if (!s || !t) throw new Error("Could not parse example.")
  return { sentence: s, translation: t }
}

export async function runGrammarAgent(
  word: string,
  sentence: string,
  translation: string,
  sourceLang: string,
  targetLang: string,
  ollamaModel: string,
): Promise<string> {
  const studyName = languageLabel(sourceLang)
  const explainName = languageLabel(targetLang)
  const prompt = sentence.trim()
    ? `You are a concise ${studyName} grammar tutor. The learner's explanation language is ${explainName}.

${studyName} sentence:
${sentence}

Target word or phrase:
${word}
${translation ? `\nLearner gloss (${explainName}, optional):\n${translation}\n` : ""}

Write 2-3 short sentences in ${explainName} only. Explain why the target appears in THIS sentence as it does. No bullet lists. No prefix like "Explanation:".`
    : `You are a concise ${studyName} grammar tutor. The learner's explanation language is ${explainName}.
Target word or phrase (${studyName}): ${word}
Write 2-3 short sentences in ${explainName} only. No bullet lists. No prefix like "Explanation:".`

  const response = await ollamaGenerate({ prompt, model: ollamaModel, stream: false })
  const trimmed = response
    .trim()
    .replace(/^(объяснение|explanation)\s*[:：]\s*/i, "")
    .trim()
  if (!trimmed) throw new Error("Empty grammar response.")
  return trimmed
}

export async function runDictionaryAiAgent(
  word: string,
  sentence: string,
  translation: string,
  sourceLang: string,
  targetLang: string,
  ollamaModel: string,
): Promise<CardFieldPatch> {
  const studyName = languageLabel(sourceLang)
  const explainName = languageLabel(targetLang)
  const response = await ollamaGenerate({
    prompt: `You help build ${studyName}→${explainName} vocabulary flashcards. Target surface form (exact): "${word}"
${sentence ? `Context sentence (${studyName}): ${sentence}` : ""}
${translation ? `Learner gloss (${explainName}, optional): ${translation}` : ""}

Output EXACTLY these lines and nothing else — no markdown, no quotes:
PART_OF_SPEECH: <e.g. noun, verb, phrasal verb; or "phrase">
PHONETIC: <IPA or simple ASCII pronunciation; or N/A>
DEFINITION: <1–2 short ${studyName} dictionary lines>
SYNONYMS: <comma-separated ${studyName} synonyms; or N/A>
ANTONYMS: <comma-separated ${studyName} antonyms; or N/A>
USAGE_NOTE: <1 short line in ${explainName}; or N/A>
GRAMMAR_NOTE: <1 short line in ${explainName}; or N/A>

Do not output lemma labels.`,
    model: ollamaModel,
    stream: false,
  })

  const patch: CardFieldPatch = {}
  const pos = pickLine(response, "PART_OF_SPEECH")
  const phon = pickLine(response, "PHONETIC")
  const def = pickLine(response, "DEFINITION")
  const syns = pickLine(response, "SYNONYMS")
  const ants = pickLine(response, "ANTONYMS")
  const usage = pickLine(response, "USAGE_NOTE")
  const gram = pickLine(response, "GRAMMAR_NOTE")

  if (pos && !/^n\/a$/i.test(pos)) patch[SENTENCE_MINING.WordTypes] = pos
  if (phon && !/^n\/a$/i.test(phon)) patch[SENTENCE_MINING.Transcription] = phon
  if (def && !/^n\/a$/i.test(def)) patch[SENTENCE_MINING.Definition] = def
  if (syns && !/^n\/a$/i.test(syns)) patch[SENTENCE_MINING.Synonyms] = syns
  if (ants && !/^n\/a$/i.test(ants)) patch[SENTENCE_MINING.Antonyms] = ants

  const noteLines: string[] = []
  if (usage && !/^n\/a$/i.test(usage)) noteLines.push(usage)
  if (gram && !/^n\/a$/i.test(gram)) noteLines.push(gram)
  if (noteLines.length) patch[SENTENCE_MINING.Notes] = noteLines.join("\n")

  if (Object.keys(patch).length === 0) throw new Error("Could not parse model output.")
  return patch
}

export async function runImageSuggestionAgent(
  word: string,
  sourceLang: string,
  ollamaModel: string,
): Promise<string> {
  const studyName = languageLabel(sourceLang)
  const response = await ollamaGenerate({
    prompt: `Suggest a short, descriptive image search query (3-6 words) for the ${studyName} vocabulary item "${word}". Output ONLY the search query, nothing else.`,
    model: ollamaModel,
    stream: false,
  })
  return response.trim() || `"${word}" vocabulary illustration`
}

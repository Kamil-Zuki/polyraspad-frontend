import { ollamaGenerate } from "@/lib/api/ollama-client"
import type { DailySummaryDto, VocabularyStatsDto } from "@/lib/api/types"
import { saveAgentEditorDraft } from "@/lib/agent/agent-editor-draft"
import {
  buildOutOfScopeRefusal,
  classifyAgentDomain,
  REFUSAL_SUGGESTED_PROMPTS,
} from "@/lib/agent/agent-domain-policy"
import {
  routeAgentIntent,
  sanitizeAgentLemmaLabels,
  type AgentNavigateDestination,
  type RoutedAgentIntent,
} from "@/lib/agent/agent-intent-router"
import type { AgentActionCard } from "@/lib/agent/agent-message"
import { createAgentMessage, type AgentMessage } from "@/lib/agent/agent-message"
import type { AgentDomainDecision } from "@/lib/agent/agent-domain-policy"
import type { AgentToolCallDto } from "@/lib/api/types"
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys"
import { buildExampleFieldPatch } from "@/lib/editor/polyguide-card-patches"
import {
  runExplainWordAgent,
  runGenerateExampleAgent,
  runGrammarAgent,
} from "@/lib/editor/polyguide-agent"
import { presetLabelForCode } from "@/lib/languages/study-language-preferences"
import type { PolyGuideLanguageTools } from "@/lib/polyguide/use-polyguide-language-tools"

export interface AgentToolExecutorDeps {
  projectId: string
  projectTitle: string
  sourceLang: string
  targetLang: string
  languageTools: PolyGuideLanguageTools
  fetchDailySummary: () => Promise<DailySummaryDto>
  fetchVocabularyStats: () => Promise<VocabularyStatsDto>
  firstDeckId?: string | null
}

const NAV_LABELS: Record<AgentNavigateDestination, { title: string; href: string; label: string }> = {
  reader: { title: "Reader", href: "/reader", label: "Open Reader" },
  editor: { title: "Create Card", href: "/editor", label: "Open Editor" },
  study: { title: "Study", href: "/study", label: "Start Review" },
  vocabulary: { title: "Vocabulary", href: "/vocabulary", label: "View Vocabulary" },
  import: { title: "Import", href: "/import", label: "Open Import" },
  library: { title: "Decks", href: "/decks", label: "Open Decks" },
}

function navigateAction(
  destination: AgentNavigateDestination,
  firstDeckId?: string | null,
): AgentActionCard {
  const meta = NAV_LABELS[destination]
  let href = meta.href
  if (destination === "study" && firstDeckId) {
    href = `/study/${firstDeckId}`
  }
  return {
    id: `nav-${destination}`,
    title: meta.title,
    description: `Go to ${meta.title.toLowerCase()}.`,
    kind: destination === "study" ? "start_study" : "navigate",
    href,
    label: meta.label,
  }
}

function editorDraftAction(
  draft: Record<string, string>,
  title: string,
  description: string,
): AgentActionCard {
  return {
    id: "open-editor-draft",
    title,
    description,
    kind: "open_editor_draft",
    href: "/editor",
    label: "Open in Editor",
    editorDraft: draft,
  }
}

const LLM_TOOL_IDS = new Set([
  "explain_word",
  "grammar_help",
  "generate_example",
  "build_card_draft",
  "general_answer",
])

export interface AgentToolRunTrace {
  message: AgentMessage
  domainDecision: AgentDomainDecision
  toolCalls: AgentToolCallDto[]
}

function buildToolCallRecord(
  intent: RoutedAgentIntent,
  userText: string,
  message: AgentMessage,
): AgentToolCallDto {
  return {
    toolName: intent.toolId,
    inputJson: JSON.stringify({
      userText,
      word: intent.word,
      sentence: intent.sentence,
      destination: intent.destination,
    }),
    outputJson: JSON.stringify({
      content: message.content,
      actions: message.actions,
      isError: message.isError,
      intentCategory: message.intentCategory,
      refusal: message.refusal,
      suggestedPrompts: message.suggestedPrompts,
    }),
    status: message.isError ? "failed" : "completed",
  }
}

function buildTrace(
  intent: RoutedAgentIntent,
  userText: string,
  domainDecision: AgentDomainDecision,
  message: AgentMessage,
): AgentToolRunTrace {
  return {
    message,
    domainDecision: intent.domain ?? domainDecision,
    toolCalls: [buildToolCallRecord(intent, userText, message)],
  }
}

export async function executeAgentTool(
  userText: string,
  deps: AgentToolExecutorDeps,
): Promise<AgentToolRunTrace> {
  const intent = routeAgentIntent(userText)
  const { languageTools } = deps
  const domainDecision = classifyAgentDomain(userText)

  if (LLM_TOOL_IDS.has(intent.toolId) && !domainDecision.allowed) {
    return handleOutOfScope(userText, deps, {
      ...intent,
      toolId: "out_of_scope",
      domain: domainDecision,
    })
  }

  try {
    switch (intent.toolId) {
      case "navigate":
        return finalize(intent, userText, domainDecision, await handleNavigate(intent, deps))
      case "get_progress":
        return finalize(intent, userText, domainDecision, await handleProgress(deps))
      case "explain_word":
        return finalize(intent, userText, domainDecision, await handleExplain(intent, deps))
      case "grammar_help":
        return finalize(intent, userText, domainDecision, await handleGrammar(intent, deps))
      case "generate_example":
        return finalize(intent, userText, domainDecision, await handleExample(intent, deps))
      case "build_card_draft":
        return finalize(intent, userText, domainDecision, await handleBuildCardDraft(intent, deps))
      case "out_of_scope":
        return handleOutOfScope(userText, deps, intent)
      case "general_answer":
        return finalize(intent, userText, domainDecision, await handleGeneralAnswer(userText, deps))
      default:
        return finalize(
          intent,
          userText,
          domainDecision,
          createAgentMessage("assistant", "I couldn't understand that request yet.", {
            isError: true,
          }),
        )
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong."
    const errorMessage =
      languageTools.aiLoadError && intent.toolId !== "get_progress" && intent.toolId !== "navigate"
        ? createAgentMessage(
            "assistant",
            `${msg} AI tools may be offline — check Settings or try a navigation action.`,
            { isError: true },
          )
        : createAgentMessage("assistant", msg, { isError: true })
    return finalize(intent, userText, domainDecision, errorMessage)
  }
}

function finalize(
  intent: RoutedAgentIntent,
  userText: string,
  domainDecision: AgentDomainDecision,
  message: AgentMessage,
): AgentToolRunTrace {
  return buildTrace(intent, userText, domainDecision, message)
}

async function handleNavigate(
  intent: RoutedAgentIntent,
  deps: AgentToolExecutorDeps,
): Promise<AgentMessage> {
  const destination = intent.destination ?? "library"
  const action = navigateAction(destination, deps.firstDeckId)
  const meta = NAV_LABELS[destination]
  return createAgentMessage(
    "assistant",
    `Opening ${meta.title}. You can continue there or ask me something else here.`,
    { actions: [action] },
  )
}

async function handleProgress(deps: AgentToolExecutorDeps): Promise<AgentMessage> {
  const [daily, vocab] = await Promise.all([
    deps.fetchDailySummary(),
    deps.fetchVocabularyStats(),
  ])

  const reviews = daily.reviews
  const newCards = daily.newCards
  const streak = daily.currentStreak ?? 0

  const content = sanitizeAgentLemmaLabels(
    `Here's your progress for ${deps.projectTitle}:

• Streak: ${streak} day${streak === 1 ? "" : "s"}
• Reviews today: ${reviews.current} / ${reviews.target}${reviews.isCompleted ? " (goal met)" : ""}
• New cards today: ${newCards.current} / ${newCards.target}${newCards.isCompleted ? " (goal met)" : ""}
• Total terms: ${vocab.totalTerms}
• Known (mature): ${vocab.matureCount}
• Learning: ${vocab.learningCount}
• New: ${vocab.newCount}`,
  )

  const actions: AgentActionCard[] = [
    navigateAction("study", deps.firstDeckId),
    navigateAction("vocabulary"),
  ]

  return createAgentMessage("assistant", content, { actions })
}

async function handleExplain(
  intent: RoutedAgentIntent,
  deps: AgentToolExecutorDeps,
): Promise<AgentMessage> {
  const word = intent.word?.trim()
  if (!word) {
    return createAgentMessage(
      "assistant",
      'Tell me which exact word or phrase to explain, e.g. Explain the word "slept".',
      { isError: true },
    )
  }

  const explanation = sanitizeAgentLemmaLabels(
    await runExplainWordAgent(
      word,
      intent.sentence ?? "",
      "",
      deps.sourceLang,
      deps.targetLang,
      deps.languageTools.ollamaModel,
    ),
  )

  const actions: AgentActionCard[] = [
    editorDraftAction(
      {
        [SENTENCE_MINING.Word]: word,
        ...(intent.sentence ? { [SENTENCE_MINING.Expression]: intent.sentence } : {}),
      },
      "Create card",
      `Save "${word}" as a flashcard draft.`,
    ),
    navigateAction("vocabulary"),
  ]

  return createAgentMessage("assistant", explanation, { actions })
}

async function handleGrammar(
  intent: RoutedAgentIntent,
  deps: AgentToolExecutorDeps,
): Promise<AgentMessage> {
  const word = intent.word?.trim()
  if (!word) {
    return createAgentMessage(
      "assistant",
      'Include the exact word or phrase for grammar help, e.g. Why is "went" used here?',
      { isError: true },
    )
  }

  const explanation = sanitizeAgentLemmaLabels(
    await runGrammarAgent(
      word,
      intent.sentence ?? "",
      "",
      deps.sourceLang,
      deps.targetLang,
      deps.languageTools.ollamaModel,
    ),
  )

  return createAgentMessage("assistant", explanation)
}

async function handleExample(
  intent: RoutedAgentIntent,
  deps: AgentToolExecutorDeps,
): Promise<AgentMessage> {
  const word = intent.word?.trim()
  if (!word) {
    return createAgentMessage(
      "assistant",
      'Which exact word or phrase should I use in an example sentence? Try: Example for "memory".',
      { isError: true },
    )
  }

  const example = await runGenerateExampleAgent(
    word,
    deps.sourceLang,
    deps.targetLang,
    deps.languageTools.ollamaModel,
  )

  const content = sanitizeAgentLemmaLabels(
    `Example for "${word}" (${presetLabelForCode(deps.sourceLang)}):\n${example.sentence}\n\nTranslation (${presetLabelForCode(deps.targetLang)}):\n${example.translation}`,
  )

  const draft: Record<string, string> = {
    [SENTENCE_MINING.Word]: word,
    ...buildExampleFieldPatch(deps.sourceLang, deps.targetLang, example),
  }

  return createAgentMessage("assistant", content, {
    actions: [editorDraftAction(draft, "Use in Editor", "Open the card editor with this draft.")],
  })
}

async function handleBuildCardDraft(
  intent: RoutedAgentIntent,
  deps: AgentToolExecutorDeps,
): Promise<AgentMessage> {
  const word = intent.word?.trim()
  if (!word) {
    return createAgentMessage(
      "assistant",
      'Which exact word or phrase should the card use? Try: Create a flashcard for "memory".',
      { isError: true },
    )
  }

  const draft: Record<string, string> = {
    [SENTENCE_MINING.Word]: word,
  }
  if (intent.sentence) draft[SENTENCE_MINING.Expression] = intent.sentence

  try {
    const dictPatch = await deps.languageTools.lookupDictionary(word)
    Object.assign(draft, dictPatch)
  } catch {
    /* dictionary optional */
  }

  if (intent.sentence) {
    try {
      const translation = await deps.languageTools.translateText(intent.sentence)
      draft[SENTENCE_MINING.Translation] = translation
    } catch {
      /* translation optional */
    }
  }

  try {
    const example = await runGenerateExampleAgent(
      word,
      deps.sourceLang,
      deps.targetLang,
      deps.languageTools.ollamaModel,
    )
    const examplePatch = buildExampleFieldPatch(deps.sourceLang, deps.targetLang, example)
    if (!draft[SENTENCE_MINING.Expression]) {
      draft[SENTENCE_MINING.Expression] = examplePatch[SENTENCE_MINING.Expression]!
    }
    if (!draft[SENTENCE_MINING.Translation]) {
      draft[SENTENCE_MINING.Translation] = examplePatch[SENTENCE_MINING.Translation]!
    }
    draft[SENTENCE_MINING.Example] = examplePatch[SENTENCE_MINING.Example]!
  } catch {
    /* example optional */
  }

  const lines = [`Draft ready for exact surface form "${word}":`]
  if (draft[SENTENCE_MINING.Definition]) lines.push(`Definition: ${draft[SENTENCE_MINING.Definition]}`)
  if (draft[SENTENCE_MINING.Translation]) lines.push(`Translation: ${draft[SENTENCE_MINING.Translation]}`)
  if (draft[SENTENCE_MINING.Example]) lines.push(`Example:\n${draft[SENTENCE_MINING.Example]}`)

  return createAgentMessage("assistant", sanitizeAgentLemmaLabels(lines.join("\n\n")), {
    actions: [
      editorDraftAction(draft, "Open draft in Editor", "Review and save the card when ready."),
    ],
  })
}

function handleOutOfScope(
  userText: string,
  deps: AgentToolExecutorDeps,
  intent: RoutedAgentIntent,
): AgentToolRunTrace {
  const studyName = presetLabelForCode(deps.sourceLang)
  const message = createAgentMessage(
    "assistant",
    buildOutOfScopeRefusal(userText, studyName),
    {
      intentCategory: "out_of_scope",
      refusal: true,
      suggestedPrompts: [...REFUSAL_SUGGESTED_PROMPTS],
    },
  )
  return buildTrace(intent, userText, intent.domain ?? classifyAgentDomain(userText), message)
}

async function handleGeneralAnswer(
  userText: string,
  deps: AgentToolExecutorDeps,
): Promise<AgentMessage> {
  const studyName = presetLabelForCode(deps.sourceLang)
  const explainName = presetLabelForCode(deps.targetLang)
  const response = await ollamaGenerate({
    prompt: `You are PolyGuide, a language-learning copilot ONLY for project "${deps.projectTitle}" (${studyName} → ${explainName}).

The learner asked: ${userText}

STRICT RULES:
- You ONLY help with language learning: vocabulary, grammar, translation, pronunciation, reading, cards, study, and progress in Polyraspad.
- If the request is NOT about language learning (code, programming, homework, business, general trivia), refuse briefly and redirect to language-learning help.
- Do NOT write code, algorithms, or general-purpose answers.
- Use exact surface forms for words/phrases; never label vocabulary with "Lemma:" or treat base forms as learning status.
- Answer briefly in ${explainName}. Suggest Reader, Editor, Study, or Vocabulary when helpful.
- No markdown.`,
    model: deps.languageTools.ollamaModel,
    stream: false,
  })

  const trimmed = sanitizeAgentLemmaLabels(response.trim())
  const looksLikeRefusal =
    /\b(can't|cannot|can't help|i can only|i'm only|refuse|not able to write code|language learning)\b/i.test(
      trimmed,
    )

  return createAgentMessage("assistant", trimmed, {
    intentCategory: "language_learning",
    refusal: looksLikeRefusal,
  })
}

/** Persist editor draft before navigation when user clicks an editor action card. */
export function applyAgentActionNavigation(action: AgentActionCard): void {
  if (action.editorDraft) {
    saveAgentEditorDraft(action.editorDraft)
  }
}

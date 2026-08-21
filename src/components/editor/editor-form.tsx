"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProjectContext } from "@/contexts/project-context";
import { useEditorCard } from "@/contexts/editor-card-context";
import { useEditorLanguage } from "@/contexts/editor-language-context";
import { useDeckTree } from "@/lib/react-query/queries";
import { useCreateCard, useUpdateCard, useCard, useNoteTypeForEditor } from "@/lib/react-query/queries";
import { CreateCardDto, SourceMetaDto, NoteFieldDefinitionDto } from "@/lib/api/types";
import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys";
import {
  fieldValuesToCreateCardDto,
  fieldValuesToUpdateCardDto,
} from "@/lib/editor/note-field-api";
import { EditorMiningFields } from "@/components/editor/editor-mining-fields";
import { useEditorCardTools } from "@/lib/editor/use-editor-card-tools";
import { useEditorAiActions } from "@/lib/editor/use-editor-ai-actions";

/** When note-type API is still loading, render the canonical Sentence Mining field list (same as server seed). */
const DEFAULT_FALLBACK_NOTE_FIELDS: NoteFieldDefinitionDto[] = [
  { fieldKey: SENTENCE_MINING.Expression, label: "Expression", fieldType: "textarea", sortOrder: 0, required: true, archived: false },
  { fieldKey: SENTENCE_MINING.Word, label: "Word", fieldType: "text", sortOrder: 1, required: true, archived: false },
  { fieldKey: SENTENCE_MINING.Translation, label: "Translation", fieldType: "textarea", sortOrder: 2, required: true, archived: false },
  { fieldKey: SENTENCE_MINING.Transcription, label: "Transcription", fieldType: "text", sortOrder: 3, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.WordTypes, label: "Word types", fieldType: "text", sortOrder: 4, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.Definition, label: "Definition", fieldType: "textarea", sortOrder: 5, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.Example, label: "Example / context", fieldType: "textarea", sortOrder: 6, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.Synonyms, label: "Synonyms", fieldType: "tags", sortOrder: 7, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.Antonyms, label: "Antonyms", fieldType: "textarea", sortOrder: 8, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.Notes, label: "Notes", fieldType: "textarea", sortOrder: 9, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.SourceTitle, label: "Source title", fieldType: "text", sortOrder: 10, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.SourceUrl, label: "Source URL", fieldType: "url", sortOrder: 11, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.Image, label: "Image", fieldType: "image", sortOrder: 12, required: false, archived: false },
  { fieldKey: SENTENCE_MINING.Audio, label: "Audio", fieldType: "audio", sortOrder: 13, required: false, archived: false },
];
import { uploadImage } from "@/lib/api/media-client";
import { resolvePublicApiBaseUrl } from "@/lib/api/public-api-url";
import { resolveCopilotLanguage } from "@/lib/integrations/preferences";
import { toast } from "sonner";
import { resolveCardImagePreview } from "@/lib/utils/media-preview-url";
import { PreviewImage } from "@/components/editor/card-preview";

const API_BASE_URL = resolvePublicApiBaseUrl();

interface EditorFormProps {
  selectedDeckId?: string;
  onSelectedDeckIdChange?: (deckId: string) => void;
}

export function EditorForm({ selectedDeckId: selectedDeckIdProp, onSelectedDeckIdChange }: EditorFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingCardId = searchParams.get("cardId")?.trim() ?? "";
  const isEditMode = editingCardId.length > 0;
  const { data: existingCard } = useCard(editingCardId);
  const { currentProject } = useProjectContext();
  const { sourceLang } = useEditorLanguage();
  const cardTools = useEditorCardTools();
  const aiActions = useEditorAiActions();
  const {
    fieldValues,
    setFieldValue,
    mergeFieldValues,
    setActiveCardTemplate,
    resetEditorFields,
    sentence,
    setSentence,
    targetWord,
    setTargetWord,
    translation,
    setTranslation,
    notes,
    setNotes,
    transcription,
    setTranscription,
    wordTypes,
    setWordTypes,
    definition,
    setDefinition,
    example,
    setExample,
    synonymsText,
    setSynonymsText,
    antonyms,
    setAntonyms,
    imageUrl,
    setImageUrl,
    imageId,
    setImageId,
    audioUrl,
    setAudioUrl,
  } = useEditorCard();
  const imagePreview = resolveCardImagePreview({
    imageId: imageId?.trim() || undefined,
    imageFieldValue: imageUrl,
    apiBaseUrl: API_BASE_URL,
  });
  const previewImageSrc = imagePreview.previewSrc;
  const { data: deckTree } = useDeckTree(currentProject?.id || "");
  const { data: noteEditor } = useNoteTypeForEditor(currentProject?.id);
  const visibleNoteFields = useMemo(
    () =>
      (noteEditor?.noteType.fields ?? [])
        .filter((f) => !f.archived)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [noteEditor]
  );
  const fieldsToRender = useMemo(
    () => (visibleNoteFields.length > 0 ? visibleNoteFields : DEFAULT_FALLBACK_NOTE_FIELDS),
    [visibleNoteFields]
  );
  const fieldsForMainForm = useMemo(
    () =>
      fieldsToRender.filter(
        (f) =>
          f.fieldKey !== SENTENCE_MINING.Image &&
          f.fieldKey !== SENTENCE_MINING.Audio
      ),
    [fieldsToRender]
  );
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  /** Р§С‚РѕР±С‹ РѕРґРёРЅ СЂР°Р· РїРѕРґСЃС‚Р°РІРёС‚СЊ sourceMeta РїСЂРё РѕС‚РєСЂС‹С‚РёРё РєР°СЂС‚РѕС‡РєРё РЅР° РїСЂР°РІРєСѓ */
  const sourceMetaHydratedForCardRef = useRef<string | null>(null);

  const [internalDeckId, setInternalDeckId] = useState<string>("");
  const selectedDeckId = selectedDeckIdProp ?? internalDeckId;
  const setSelectedDeckId = onSelectedDeckIdChange ?? setInternalDeckId;
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [showAudioUrlInput, setShowAudioUrlInput] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [sourceMeta, setSourceMeta] = useState<SourceMetaDto | null>(null);
  const [sourceForm, setSourceForm] = useState<{ type: string; title: string; url: string; timestamp: number }>({ type: "youtube", title: "", url: "", timestamp: 0 });
  const [isEditingSource, setIsEditingSource] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const sentenceTextareaRef = useRef<HTMLTextAreaElement>(null);
  /** Pending image blob: uploaded to MinIO only when user clicks Create Card */
  const pendingImageBlobRef = useRef<Blob | null>(null);
  const previewBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (cardTools.lastError) setError(cardTools.lastError);
  }, [cardTools.lastError]);

  useEffect(() => {
    setImagePreviewError(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!isEditMode) sourceMetaHydratedForCardRef.current = null;
  }, [isEditMode]);

  const handleDictionaryLookup = useCallback(
    async (wordOverride?: string) => {
      setError("");
      cardTools.clearError();
      await cardTools.lookupDictionary(wordOverride);
    },
    [cardTools],
  );

  const handleGenerateCardAudio = useCallback(async () => {
    setError("");
    cardTools.clearError();
    const patch = await cardTools.generateCardAudio();
    if (patch?.[SENTENCE_MINING.Audio]) setShowAudioUrlInput(true);
  }, [cardTools, setShowAudioUrlInput]);

  const handleTranslate = useCallback(async () => {
    setError("");
    cardTools.clearError();
    await cardTools.translateWithTranslator();
  }, [cardTools]);

  const handleAutoFill = useCallback(async () => {
    setError("");
    cardTools.clearError();
    const result = await cardTools.autoFillCard();
    if (!result) {
      setError(cardTools.lastError || "Auto-fill failed. Enter an expression and target word first.");
      return;
    }
    const appliedCount = Object.keys(result.applied).length;
    const stagedCount = Object.keys(result.staged).length;
    if (appliedCount > 0) {
      mergeFieldValues(result.applied);
      toast.success(`Auto-filled ${appliedCount} field${appliedCount === 1 ? "" : "s"}`);
    }
    if (stagedCount > 0) {
      toast.info(`${stagedCount} field${stagedCount === 1 ? "" : "s"} already had values and were skipped.`);
    }
  }, [cardTools, mergeFieldValues]);
  useEffect(() => {
    if (onSelectedDeckIdChange != null) return;
    if (selectedDeckId) return;
    if (!deckTree || deckTree.length === 0) return;

    const firstDeck = findFirstDeck(deckTree);
    if (firstDeck?.id) setInternalDeckId(firstDeck.id);
  }, [deckTree, selectedDeckId, onSelectedDeckIdChange]);

  // Get first available deck as default (after data loads) when using internal state
  useEffect(() => {
    if (!isEditMode || !existingCard?.id) return;
    if (sourceMetaHydratedForCardRef.current === existingCard.id) return;
    sourceMetaHydratedForCardRef.current = existingCard.id;
    const fv = existingCard.note?.fieldValues;
    const title = fv?.[SENTENCE_MINING.SourceTitle]?.stringValue?.trim();
    const url = fv?.[SENTENCE_MINING.SourceUrl]?.stringValue?.trim();
    if (title || url) {
      setSourceMeta({
        type: "youtube",
        title: title ?? "",
        url: url || undefined,
      });
    } else {
      setSourceMeta(null);
    }
  }, [isEditMode, existingCard?.id, existingCard?.note?.fieldValues]);

  useEffect(() => {
    if (isEditMode) return;
    if (noteEditor?.defaultTemplate) {
      setActiveCardTemplate(noteEditor.defaultTemplate);
    }
  }, [isEditMode, noteEditor?.defaultTemplate, setActiveCardTemplate]);

  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
      }
      pendingImageBlobRef.current = null;
    };
  }, []);

  const clearPendingImage = useCallback(() => {
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
      previewBlobUrlRef.current = null;
    }
    pendingImageBlobRef.current = null;
    setImageUrl("");
    setImageId("");
  }, [setImageUrl, setImageId]);

  const setPendingImageBlob = useCallback(
    (blob: Blob) => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
      }
      pendingImageBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      previewBlobUrlRef.current = url;
      setImageUrl(url);
      setImageId("");
      setImageUploadError("");
      setImagePreviewError(false);
    },
    [setImageUrl, setImageId]
  );


  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            setPendingImageBlob(blob);
            return;
          }
        }
      }
      setImageUploadError("No image in clipboard");
    } catch (e) {
      setImageUploadError("Clipboard access denied or no image");
    }
  }, [setPendingImageBlob]);

  const handleImageFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        setPendingImageBlob(file);
      }
      e.target.value = "";
    },
    [setPendingImageBlob]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        const target = e.target as HTMLElement;
        if (target.closest('input[type="url"]') || target.closest("textarea") || target.closest('input[type="text"]')) return;
        navigator.clipboard.read().then((items) => {
          for (const item of items) {
            for (const type of item.types) {
              if (type.startsWith("image/")) {
                e.preventDefault();
                item.getType(type).then((blob) => setPendingImageBlob(blob));
                return;
              }
            }
          }
        });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setPendingImageBlob]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        (document.getElementById("editor-form") as HTMLFormElement | null)?.requestSubmit();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        (document.getElementById("editor-form") as HTMLFormElement | null)?.requestSubmit();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const buildMergedFieldValues = useCallback(() => {
    const merged = { ...fieldValues };
    const titleFromFv = String(merged[SENTENCE_MINING.SourceTitle] ?? "").trim();
    const urlFromFv = String(merged[SENTENCE_MINING.SourceUrl] ?? "").trim();
    if (!titleFromFv && sourceMeta?.title) merged[SENTENCE_MINING.SourceTitle] = sourceMeta.title;
    if (!urlFromFv && sourceMeta?.url) merged[SENTENCE_MINING.SourceUrl] = sourceMeta.url ?? "";
    return merged;
  }, [fieldValues, sourceMeta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isEditMode && !selectedDeckId) {
      setError("Please select a deck");
      return;
    }

    const fvMerged = buildMergedFieldValues();

    if (visibleNoteFields.length > 0) {
      for (const f of visibleNoteFields) {
        if (!f.required) continue;
        if (!(fvMerged[f.fieldKey] ?? "").trim()) {
          setError(`Fill required field: ${f.label}`);
          return;
        }
      }
    } else if (!sentence.trim() || !targetWord.trim() || !translation.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrlAfterUpload: string | undefined;
      let imageIdAfterUpload: string | undefined;
      if (pendingImageBlobRef.current) {
        const { url, imageId: uploadedImageId } = await uploadImage(pendingImageBlobRef.current);
        imageUrlAfterUpload = url;
        imageIdAfterUpload = uploadedImageId ?? undefined;
      }

      const mediaOpts = {
        imageId: imageIdAfterUpload,
        imageUrl: imageUrlAfterUpload,
        audioUrl: audioUrl.trim() || undefined,
      };

      if (isEditMode) {
        const payload = fieldValuesToUpdateCardDto(fvMerged, mediaOpts);
        await updateCard.mutateAsync({ id: editingCardId, data: payload });
        if (pendingImageBlobRef.current) {
          if (previewBlobUrlRef.current) {
            URL.revokeObjectURL(previewBlobUrlRef.current);
            previewBlobUrlRef.current = null;
          }
          pendingImageBlobRef.current = null;
          setImageId(imageIdAfterUpload ?? "");
          setImageUrl(imageIdAfterUpload ?? imageUrlAfterUpload ?? "");
        }
        toast.success("Card updated!");
        sentenceTextareaRef.current?.focus();
        return;
      }

      const cardData = fieldValuesToCreateCardDto(fvMerged, selectedDeckId, mediaOpts);

      await createCard.mutateAsync(cardData);

      clearPendingImage();
      resetEditorFields();
      setShowImageUrlInput(false);
      setShowAudioUrlInput(false);
      setImagePreviewError(false);
      setSourceMeta(null);
      sourceMetaHydratedForCardRef.current = null;

      toast.success("Saved!");
      sentenceTextareaRef.current?.focus();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : isEditMode ? "Failed to update card" : "Failed to create card"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const useSelectedWordFromExpression = () => {
    const ta = sentenceTextareaRef.current
    if (!ta) return
    const sel = sentence.slice(ta.selectionStart, ta.selectionEnd).trim()
    const w = normalizeWordToken(sel)
    if (w) setTargetWord(w)
  };

  return (
    <form
      id="editor-form"
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto space-y-8 relative z-10 py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {error && (
        <div className="glass-panel p-4 rounded-xl border-red-500/30 bg-red-500/10">
          <div className="text-red-400 text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        </div>
      )}

      {/* Fields from note type definition (dynamic order, Sentence Mining) */}
      <EditorMiningFields
        fields={fieldsForMainForm}
        fieldValues={fieldValues}
        setFieldValue={setFieldValue}
        sentence={sentence}
        setSentence={setSentence}
        targetWord={targetWord}
        setTargetWord={setTargetWord}
        translation={translation}
        setTranslation={setTranslation}
        transcription={transcription}
        setTranscription={setTranscription}
        wordTypes={wordTypes}
        setWordTypes={setWordTypes}
        definition={definition}
        setDefinition={setDefinition}
        example={example}
        setExample={setExample}
        synonymsText={synonymsText}
        setSynonymsText={setSynonymsText}
        antonyms={antonyms}
        setAntonyms={setAntonyms}
        notes={notes}
        setNotes={setNotes}
        sentenceTextareaRef={sentenceTextareaRef}
        useSelectedWordFromExpression={useSelectedWordFromExpression}
        ExpressionWordPicker={ExpressionWordPicker}
        isLookingUpDictionary={cardTools.isLookingUpDictionary}
        handleDictionaryLookup={handleDictionaryLookup}
        isTranslating={cardTools.isTranslating}
        handleTranslate={handleTranslate}
        aiError={aiActions.aiError}
        onClearAiError={aiActions.clearAiError}
        isAutoFilling={cardTools.isAutoFilling}
        onAutoFill={handleAutoFill}
      />
      {/* 3. Media Attachments — compact inline controls */}
      <section className="glass-panel p-6 rounded-3xl border-app-border">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
          Media Attachments
        </label>

        <div className="space-y-4">
          {/* Image */}
          <div className="rounded-2xl border border-white/10 bg-app-bg p-3">
            {imagePreview.hasImage && !imagePreviewError ? (
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10">
                  <PreviewImage
                    src={previewImageSrc}
                    fallbackSrc={imagePreview.fallbackSrc}
                    alt="Image preview"
                    className="h-full w-full"
                    imgClassName="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => imageFileInputRef.current?.click()}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUploadError("");
                      setShowImageUrlInput(true);
                    }}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Paste URL
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePasteFromClipboard()}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Paste image
                  </button>
                  {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && (
                    <button
                      type="button"
                      onClick={() => {
                        aiActions.clearAiError();
                        void aiActions.suggestImage().then((patch) => {
                          if (patch?.[SENTENCE_MINING.Image]) setImageUrl(patch[SENTENCE_MINING.Image]);
                        });
                      }}
                      disabled={aiActions.isAiBusy || !targetWord.trim()}
                      title={targetWord.trim() ? "Suggest an AI image" : "Enter a target word first"}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50",
                        aiActions.isAiBusy
                          ? "bg-white/5 text-gray-500 cursor-not-allowed"
                          : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
                      )}
                    >
                      <i className={cn("fas", aiActions.isAiBusy ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles")} />
                      ✨ AI Generate Image
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      clearPendingImage();
                      setImagePreviewError(false);
                      setShowImageUrlInput(false);
                    }}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : showImageUrlInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="input-dark flex-1 text-xs py-2 px-3"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowImageUrlInput(false);
                  }}
                />
                {imageUrl.trim() && (
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-xs"
                    onClick={() => {
                      clearPendingImage();
                      setImagePreviewError(false);
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-white px-2"
                  onClick={() => setShowImageUrlInput(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-xs text-gray-500">
                  <i className="fas fa-image mr-1.5" />
                  Image
                </span>
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageUploadError("");
                    setShowImageUrlInput(true);
                  }}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Paste URL
                </button>
                <button
                  type="button"
                  onClick={() => void handlePasteFromClipboard()}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Paste image
                </button>
                {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && (
                  <button
                    type="button"
                    onClick={() => {
                      aiActions.clearAiError();
                      void aiActions.suggestImage().then((patch) => {
                        if (patch?.[SENTENCE_MINING.Image]) setImageUrl(patch[SENTENCE_MINING.Image]);
                      });
                    }}
                    disabled={aiActions.isAiBusy || !targetWord.trim()}
                    title={targetWord.trim() ? "Suggest an AI image" : "Enter a target word first"}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50",
                      aiActions.isAiBusy
                        ? "bg-white/5 text-gray-500 cursor-not-allowed"
                        : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
                    )}
                  >
                    <i className={cn("fas", aiActions.isAiBusy ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles")} />
                    AI image
                  </button>
                )}
              </div>
            )}

            {imageUploadError && (
              <div className="mt-2 text-xs text-red-400">{imageUploadError}</div>
            )}

            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileSelect}
            />
          </div>

          {/* Audio */}
          <div className="rounded-2xl border border-white/10 bg-app-bg p-3">
            {audioUrl.trim() ? (
              <div className="space-y-3">
                <audio
                  src={audioUrl.trim()}
                  controls
                  className="w-full h-8 opacity-90"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAudioUrlInput(true)}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Change URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAudioUrl("");
                      setShowAudioUrlInput(false);
                    }}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : showAudioUrlInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="Paste audio URL..."
                  className="input-dark flex-1 text-xs py-2 px-3"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowAudioUrlInput(false);
                  }}
                />
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-white px-2"
                  onClick={() => setShowAudioUrlInput(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-xs text-gray-500">
                  <i className="fas fa-microphone mr-1.5" />
                  Audio
                </span>
                <button
                  type="button"
                  onClick={() => setShowAudioUrlInput(true)}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Paste URL
                </button>
                {process.env.NEXT_PUBLIC_FF_AI_AGENTS === "true" && (
                  <button
                    type="button"
                    disabled={cardTools.isGeneratingAudio}
                    title={`Server TTS (${resolveCopilotLanguage(sourceLang)}) — uses Word or Expression`}
                    onClick={() => void handleGenerateCardAudio()}
                    className={cn(
                      "rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                      cardTools.isGeneratingAudio
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-brand-secondary hover:bg-brand-secondary/10 hover:text-white"
                    )}
                  >
                    {cardTools.isGeneratingAudio ? (
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-spinner fa-spin" /> Generating
                      </span>
                    ) : (
                      "✨ AI Text-to-Speech"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Source Information — compact inline */}
      <section className="glass-panel p-6 rounded-3xl border-app-border">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
          Source Reference
        </label>

        {sourceMeta && !isEditingSource ? (
          <div className="rounded-2xl border border-white/10 bg-app-bg p-3 flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
              sourceMeta.type === "youtube"
                ? "bg-red-600/10 text-red-500 border-red-500/20"
                : "bg-app-surface text-gray-400 border-white/10"
            )}>
              {sourceMeta.type === "youtube" ? (
                <i className="fab fa-youtube text-xl" />
              ) : (
                <i className="fas fa-book text-lg" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
                {sourceMeta.type === "youtube" ? "YouTube" : sourceMeta.type}
              </div>
              <div className="text-sm text-white font-medium truncate">{sourceMeta.title}</div>
              {sourceMeta.timestamp != null && (
                <div className="text-[10px] text-gray-400">
                  {Math.floor((sourceMeta.timestamp ?? 0) / 60)}:{String((sourceMeta.timestamp ?? 0) % 60).padStart(2, "0")}
                </div>
              )}
              {sourceMeta.url && (
                <a
                  href={sourceMeta.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-brand-secondary truncate block hover:underline"
                >
                  {sourceMeta.url}
                </a>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setSourceForm({
                    type: sourceMeta.type,
                    title: sourceMeta.title,
                    url: sourceMeta.url ?? "",
                    timestamp: sourceMeta.timestamp ?? 0,
                  });
                  setIsEditingSource(true);
                }}
                className="text-gray-500 hover:text-white transition-colors p-2"
                aria-label="Edit source"
                title="Edit source"
              >
                <i className="fas fa-pen text-xs" />
              </button>
              <button
                type="button"
                onClick={() => setSourceMeta(null)}
                className="text-gray-600 hover:text-white transition-colors p-2"
                aria-label="Remove source"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-app-bg p-3 space-y-3">
            <div className="flex gap-1 border-b border-white/10">
              {(["youtube", "book", "article"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSourceForm((s) => ({ ...s, type }))}
                  className={cn(
                    "flex-1 px-3 py-2 text-xs font-medium transition border-b-2 -mb-px",
                    sourceForm.type === type
                      ? "text-brand-primary border-brand-primary"
                      : "text-gray-400 hover:text-white border-transparent"
                  )}
                >
                  {type === "youtube" ? "YouTube" : type === "book" ? "Book" : "Article"}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={sourceForm.title}
              onChange={(e) => setSourceForm((s) => ({ ...s, title: e.target.value }))}
              placeholder="Title"
              className="input-dark w-full py-2 px-3 rounded-lg text-sm"
            />

            {sourceForm.type === "youtube" && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={sourceForm.url}
                  onChange={(e) => setSourceForm((s) => ({ ...s, url: e.target.value }))}
                  placeholder="URL"
                  className="input-dark flex-1 py-2 px-3 rounded-lg text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={sourceForm.timestamp || ""}
                  onChange={(e) => setSourceForm((s) => ({ ...s, timestamp: e.target.value ? Number(e.target.value) : 0 }))}
                  placeholder="Sec"
                  className="input-dark w-24 py-2 px-3 rounded-lg text-sm"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              {sourceMeta && (
                <button
                  type="button"
                  onClick={() => setIsEditingSource(false)}
                  className="btn-secondary py-1.5 px-4 text-xs"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const meta: SourceMetaDto = {
                    type: sourceForm.type,
                    title: sourceForm.title || sourceForm.type,
                    ...(sourceForm.type === "youtube" && sourceForm.url ? { url: sourceForm.url, timestamp: sourceForm.timestamp || undefined, service: "youtube" } : {}),
                  };
                  setSourceMeta(meta);
                  setSourceForm({ type: "youtube", title: "", url: "", timestamp: 0 });
                  setIsEditingSource(false);
                }}
                disabled={!sourceForm.title.trim()}
                className="btn-primary py-1.5 px-4 text-xs disabled:opacity-50"
              >
                {sourceMeta ? "Save source" : "Add source"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Sticky Submit Footer */}
      <div className="sticky bottom-0 z-10 -mx-6 px-6 py-4 bg-app-bg/90 backdrop-blur border-t border-app-border">
        <div className="max-w-3xl mx-auto flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (!isEditMode && !selectedDeckId)}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Card"
                : "Save Card"}
          </button>
        </div>
      </div>
    </form>
  );
}

function normalizeWordToken(value: string): string {
  return value.replace(/^[^\p{L}\p{N}'-]+|[^\p{L}\p{N}'-]+$/gu, "").trim()
}

function tokenizeExpression(value: string): { isWord: boolean; value: string }[] {
  const matches = value.match(/[\p{L}\p{N}'-]+|[^\p{L}\p{N}'-]+/gu) || []
  return matches
    .map((token) => ({
      isWord: Boolean(normalizeWordToken(token)),
      value: token,
    }))
    .filter((token) => token.value.trim() || token.isWord)
}

function ExpressionWordPicker({
  expression,
  selectedWord,
  isLoading,
  onPickWord,
}: {
  expression: string
  selectedWord: string
  isLoading: boolean
  onPickWord: (word: string) => void
}) {
  const tokens = tokenizeExpression(expression)
  if (tokens.length === 0) {
    return (
      <p className="text-[10px] text-gray-500 mt-4">
        Type an expression, then click a word for target + dictionary fill.
      </p>
    )
  }
  return (
    <div className="mt-4" aria-label="Words in expression">
      <p className="text-[10px] text-gray-500 mb-2">Click a word to set target and define</p>
      <div className="flex flex-wrap gap-1.5">
        {tokens.map((token, index) =>
          token.isWord ? (
            <button
              type="button"
              key={`${token.value}-${index}`}
              disabled={isLoading}
              onClick={() => onPickWord(token.value)}
              className={cn(
                "px-2 py-1 rounded-lg text-sm border transition-colors",
                normalizeWordToken(token.value).toLowerCase() === selectedWord.trim().toLowerCase()
                  ? "border-brand-primary bg-brand-primary/20 text-white"
                  : "border-white/10 bg-app-bg text-gray-300 hover:border-brand-primary/50 hover:text-white",
              )}
            >
              {token.value}
            </button>
          ) : (
            <span key={`${token.value}-${index}`} className="text-gray-600 select-none">
              {token.value}
            </span>
          ),
        )}
      </div>
    </div>
  )
}

// Helper functions
function findFirstDeck(tree: any[]): any | null {
  for (const node of tree) {
    if (!node.children || node.children.length === 0) {
      return node;
    }
    const found = findFirstDeck(node.children);
    if (found) return found;
  }
  return null;
}

function flattenDeckTree(tree: any[]): any[] {
  const result: any[] = [];
  for (const node of tree) {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result.push(...flattenDeckTree(node.children));
    }
  }
  return result;
}

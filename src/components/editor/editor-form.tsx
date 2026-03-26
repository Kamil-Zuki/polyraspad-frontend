"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProjectContext } from "@/contexts/project-context";
import { useEditorCard } from "@/contexts/editor-card-context";
import { useDeckTree } from "@/lib/react-query/queries";
import { useCreateCard } from "@/lib/react-query/queries";
import { CreateCardDto, SourceMetaDto } from "@/lib/api/types";
import { uploadImage } from "@/lib/api/media-client";
import { getPreviewImageSrc } from "@/lib/utils/media-preview-url";
import { PreviewImage } from "@/components/editor/card-preview";
import {
  ollamaGenerate,
  ollamaListModels,
  resolveEditorOllamaModel,
  EDITOR_DEFAULT_OLLAMA_MODEL,
} from "@/lib/api/ollama-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface EditorFormProps {
  selectedDeckId?: string;
  onSelectedDeckIdChange?: (deckId: string) => void;
}

export function EditorForm({ selectedDeckId: selectedDeckIdProp, onSelectedDeckIdChange }: EditorFormProps) {
  const router = useRouter();
  const { currentProject } = useProjectContext();
  const {
    sentence,
    setSentence,
    targetWord,
    setTargetWord,
    translation,
    setTranslation,
    notes,
    setNotes,
    imageUrl,
    setImageUrl,
    imageId,
    setImageId,
    audioUrl,
    setAudioUrl,
  } = useEditorCard();
  const previewImageSrc = getPreviewImageSrc({
    imageId: imageId?.trim() || undefined,
    imageUrl: imageUrl?.trim() || undefined,
    apiBaseUrl: API_BASE_URL,
  });
  const { data: deckTree } = useDeckTree(currentProject?.id || "");
  const createCard = useCreateCard();

  const [internalDeckId, setInternalDeckId] = useState<string>("");
  const selectedDeckId = selectedDeckIdProp ?? internalDeckId;
  const setSelectedDeckId = onSelectedDeckIdChange ?? setInternalDeckId;
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  /** Идентификатор модели в UI (Ollama или Gemini в зависимости от провайдера на сервере) */
  const [translateOllamaModel, setTranslateOllamaModel] = useState(EDITOR_DEFAULT_OLLAMA_MODEL);
  const [editorAiProvider, setEditorAiProvider] = useState<"ollama" | "gemini">("ollama");
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [showImageActionChoice, setShowImageActionChoice] = useState(false);
  const [showAudioUrlInput, setShowAudioUrlInput] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [sourceMeta, setSourceMeta] = useState<SourceMetaDto | null>(null);
  const [showAddSource, setShowAddSource] = useState(false);
  const [sourceForm, setSourceForm] = useState<{ type: string; title: string; url: string; timestamp: number }>({ type: "youtube", title: "", url: "", timestamp: 0 });
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const sentenceTextareaRef = useRef<HTMLTextAreaElement>(null);
  /** Pending image blob: uploaded to MinIO only when user clicks Create Card */
  const pendingImageBlobRef = useRef<Blob | null>(null);
  const previewBlobUrlRef = useRef<string | null>(null);

  // Get first available deck as default (after data loads) when using internal state
  useEffect(() => {
    if (onSelectedDeckIdChange != null) return;
    if (selectedDeckId) return;
    if (!deckTree || deckTree.length === 0) return;

    const firstDeck = findFirstDeck(deckTree);
    if (firstDeck?.id) setInternalDeckId(firstDeck.id);
  }, [deckTree, selectedDeckId, onSelectedDeckIdChange]);

  useEffect(() => {
    ollamaListModels()
      .then(({ models, provider }) => {
        setEditorAiProvider(provider);
        if (provider === "gemini" && models.length > 0) {
          setTranslateOllamaModel(models[0]);
        } else {
          setTranslateOllamaModel(resolveEditorOllamaModel(models));
        }
      })
      .catch(() => {
        setEditorAiProvider("ollama");
        setTranslateOllamaModel(EDITOR_DEFAULT_OLLAMA_MODEL);
      });
  }, []);

  useEffect(() => {
    setImagePreviewError(false);
  }, [imageUrl]);

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
      setShowImageActionChoice(false);
    },
    [setImageUrl, setImageId]
  );

  const handleAiTranslate = async () => {
    if (isTranslating) return;

    const s = sentence.trim();
    const w = targetWord.trim();
    if (!s) {
      setError("Введите предложение (Sentence), чтобы перевести в контексте.");
      return;
    }

    setError("");
    setIsTranslating(true);
    try {
      const targetHint = w
        ? `Focus word or phrase: "${w}".`
        : "No separate target word — translate the whole sentence naturally.";
      const prompt = `You are a translator for English→Russian flashcards.
English sentence: """${s}"""
${targetHint}
Task: Output ONE concise Russian line: the meaning of the sentence in context (how the focus word is used, if given). 
Rules: Russian only. No quotes around the answer. No labels like "Translation:". No English.`;

      const text = await ollamaGenerate({
        prompt,
        model: translateOllamaModel,
        stream: false,
      });

      const cleaned = text
        .trim()
        .replace(/^(translation|перевод)\s*[:：]\s*/i, "")
        .replace(/^["'`«»]+|["'`«»]+$/g, "")
        .trim();

      if (cleaned) {
        setTranslation(cleaned);
      } else {
        setError("Модель вернула пустой перевод. Попробуйте ещё раз.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка AI Translate.");
    } finally {
      setIsTranslating(false);
    }
  };

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
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedDeckId) {
      setError("Please select a deck");
      return;
    }

    if (!sentence || !targetWord || !translation) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrlToSend = imageUrl.trim();
      let imageIdToSend: string | undefined = imageId?.trim() || undefined;

      if (pendingImageBlobRef.current) {
        const { url, imageId: uploadedImageId } = await uploadImage(pendingImageBlobRef.current);
        imageUrlToSend = url;
        imageIdToSend = uploadedImageId ?? undefined;
      }

      const cardData: CreateCardDto = {
        deckId: selectedDeckId,
        sentence,
        targetWord,
        translation,
        ...(imageUrlToSend ? { imageUrl: imageUrlToSend } : {}),
        ...(imageIdToSend ? { imageId: imageIdToSend } : {}),
        ...(audioUrl.trim() ? { audioUrl: audioUrl.trim() } : {}),
        ...(sourceMeta ? { sourceMeta } : {}),
      };

      await createCard.mutateAsync(cardData);

      // Reset form and revoke pending image blob URL
      clearPendingImage();
      setSentence("");
      setTargetWord("");
      setTranslation("");
      setNotes("");
      setAudioUrl("");
      setShowImageUrlInput(false);
      setShowAudioUrlInput(false);
      setImagePreviewError(false);
      setSourceMeta(null);
      setShowAddSource(false);

      alert("Saved!");
      sentenceTextareaRef.current?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to create card");
    } finally {
      setIsSubmitting(false);
    }
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

      {/* 1. Sentence (Front) */}
      <section className="glass-panel p-8 rounded-3xl border-app-border">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
          Front (Sentence)
        </label>
        <div className="relative group">
          <textarea
            ref={sentenceTextareaRef}
            data-testid="sentence-input"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onSelect={() => {
              const ta = sentenceTextareaRef.current
              if (!ta) return
              const start = ta.selectionStart
              const end = ta.selectionEnd
              if (start === end) return
              const selected = sentence.slice(start, end).trim()
              if (selected) setTargetWord(selected)
            }}
            className="input-dark w-full p-5 rounded-2xl text-xl min-h-[140px] resize-none leading-relaxed"
            placeholder="Type or paste your sentence here..."
            required
          />
          <div className="absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest text-gray-600 group-focus-within:text-brand-primary transition-colors">
            Highlight word to set Target
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          Example: "He decided to{" "}
          <strong className="text-brand-primary font-bold">address</strong> the
          issue."
        </p>
      </section>

      {/* 2. Target & Translation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="glass-panel p-8 rounded-3xl border-app-border">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
            Target Word
          </label>
          <input
            type="text"
            data-testid="target-input"
            value={targetWord}
            onChange={(e) => setTargetWord(e.target.value)}
            className="input-dark w-full p-4 rounded-xl font-bold text-white"
            placeholder="Auto-filled..."
            required
          />
          <p className="text-[10px] text-gray-500 mt-3 font-medium uppercase tracking-wider">
            Focus word for this card
          </p>
        </section>

        <section className="glass-panel p-8 rounded-3xl border-app-border">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Back (Meaning)
            </label>
            <button
              type="button"
              onClick={handleAiTranslate}
              disabled={isTranslating || !sentence.trim()}
              title={`${editorAiProvider === "gemini" ? "Gemini" : "Ollama"}: ${translateOllamaModel}`}
              className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i
                className={cn(
                  "fas",
                  isTranslating ? "fa-spinner fa-spin" : "fa-magic",
                )}
              />{" "}
              {isTranslating ? "Translating..." : "AI Translate"}
            </button>
          </div>
          <input
            type="text"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="input-dark w-full p-4 rounded-xl text-white"
            placeholder="Translation..."
            required
          />
          <p className="text-[10px] text-gray-500 mt-3 font-medium uppercase tracking-wider">
            Translation in context
          </p>
        </section>
      </div>

      {/* 2b. Notes (optional) */}
      <section className="glass-panel p-8 rounded-3xl border-app-border">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-dark w-full p-4 rounded-xl text-sm min-h-[80px] resize-none"
          placeholder="Grammar notes, usage tips... (use AI Assistant &quot;Add to notes&quot;)"
        />
      </section>

      {/* 3. Media (Anki Style) */}
      <section className="glass-panel p-8 rounded-3xl border-app-border">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
          Media Attachments
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Image Dropzone */}
          <div
            className={cn(
              "bg-app-bg border-2 border-dashed border-white/5 rounded-2xl h-36 relative overflow-hidden group hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-300",
              showImageUrlInput || showImageActionChoice ? "cursor-default" : "cursor-pointer",
            )}
            onClick={() => {
              if (!showImageUrlInput && !showImageActionChoice && !imageUrl.trim()) {
                setImageUploadError("");
                setShowImageActionChoice(true);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith("image/")) setPendingImageBlob(file);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {imageUrl.trim() && !imagePreviewError ? (
              <PreviewImage
                src={previewImageSrc}
                fallbackSrc={imageUrl?.trim() || undefined}
                alt="Image preview"
                className="absolute inset-0 rounded-2xl overflow-hidden border-0"
                imgClassName="w-full h-full min-h-0 max-h-none object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-app-surface border border-white/5 flex items-center justify-center mb-3 text-gray-600 group-hover:text-brand-primary group-hover:shadow-glow group-hover:bg-brand-primary/10 transition-all">
                  <i className="fas fa-image text-lg" />
                </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white">
                    {imageUrl.trim()
                      ? "Invalid image URL"
                      : "Drop image or Paste (Ctrl+V)"}
                  </span>
              </div>
            )}

            {imageUploadError && (
              <div className="absolute top-2 left-2 right-2 text-[10px] text-red-400 truncate" title={imageUploadError}>
                {imageUploadError}
              </div>
            )}

            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileSelect}
            />

            <div className="absolute inset-x-3 bottom-3">
              {showImageActionChoice ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 py-2 bg-app-surface/80 hover:bg-app-surface border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePasteFromClipboard();
                      }}
                    >
                      <i className="fas fa-paste text-xs" /> From clipboard
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-2 bg-app-surface/80 hover:bg-app-surface border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        imageFileInputRef.current?.click();
                      }}
                    >
                      <i className="fas fa-folder-open text-xs" /> From device
                    </button>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 bg-app-surface/80 hover:bg-app-surface border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPendingImage();
                      setShowImageActionChoice(false);
                      setShowImageUrlInput(true);
                    }}
                  >
                    Paste URL
                  </button>
                  <button
                    type="button"
                    className="w-full py-1.5 text-[10px] text-gray-500 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageActionChoice(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : showImageUrlInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="input-dark w-full text-xs py-2 px-3"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setShowImageUrlInput(false);
                    }}
                  />
                  {imageUrl.trim() && (
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearPendingImage();
                        setImagePreviewError(false);
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    className="flex-1 py-2 bg-app-surface/80 hover:bg-app-surface border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageActionChoice(true);
                    }}
                  >
                    {imageUrl.trim() ? "Change image" : "Add image"}
                  </button>
                  {imageUrl.trim() && (
                    <button
                      type="button"
                      className="py-2 px-3 bg-app-surface/80 hover:bg-app-surface border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearPendingImage();
                        setImagePreviewError(false);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Audio Dropzone */}
          <div
            className={cn(
              "bg-app-bg border-2 border-dashed border-white/5 rounded-2xl h-36 relative overflow-hidden group hover:border-brand-secondary/50 hover:bg-brand-secondary/5 transition-all duration-300",
              showAudioUrlInput ? "cursor-default" : "cursor-pointer",
            )}
            onClick={() => {
              if (!showAudioUrlInput) setShowAudioUrlInput(true);
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {audioUrl.trim() ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-app-surface border border-white/5 flex items-center justify-center mb-3 text-gray-600 group-hover:text-brand-secondary group-hover:shadow-glow group-hover:bg-brand-secondary/10 transition-all">
                    <i className="fas fa-play text-lg" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white">
                    Audio URL attached
                  </span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-app-surface border border-white/5 flex items-center justify-center mb-3 text-gray-600 group-hover:text-brand-secondary group-hover:shadow-glow group-hover:bg-brand-secondary/10 transition-all">
                    <i className="fas fa-microphone text-lg" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white">
                    Upload audio or Record
                  </span>
                </>
              )}
            </div>

            <div className="absolute inset-x-3 bottom-3">
              {showAudioUrlInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="Paste audio URL..."
                    className="input-dark w-full text-xs py-2 px-3"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setShowAudioUrlInput(false);
                    }}
                  />
                  {audioUrl.trim() && (
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAudioUrl("");
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full py-2 bg-app-surface/80 hover:bg-app-surface border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAudioUrlInput(true);
                  }}
                >
                  Paste URL
                </button>
              )}
            </div>

            {audioUrl.trim() && (
              <div className="absolute left-3 right-3 top-3">
                <audio
                  src={audioUrl.trim()}
                  controls
                  className="w-full h-8 opacity-90"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Auto TTS Toggle */}
            <label className="absolute top-3 right-3 flex items-center gap-2 cursor-pointer bg-app-surface px-2.5 py-1.5 rounded-lg border border-white/5 shadow-lg group/tts">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider group-hover/tts:text-brand-primary transition-colors">
                Auto TTS
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  defaultChecked
                  className="peer sr-only"
                />
                <div className="w-7 h-4 bg-gray-700 rounded-full peer peer-checked:bg-brand-primary transition-colors" />
                <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full transition-transform peer-checked:translate-x-3" />
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* 4. Source Information */}
      <section className="glass-panel p-8 rounded-3xl border-app-border">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
          Source Information
        </label>
        <div className="space-y-4">
          {sourceMeta && (
            <div className="bg-app-bg p-5 rounded-2xl border border-white/5 flex items-center gap-4 group">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg",
                sourceMeta.type === "youtube"
                  ? "bg-red-600/10 text-red-500 border-red-500/20"
                  : "bg-app-surface text-gray-400 border-white/10",
              )}>
                {sourceMeta.type === "youtube" ? (
                  <i className="fab fa-youtube text-2xl" />
                ) : (
                  <i className="fas fa-book text-xl" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                  {sourceMeta.type === "youtube" ? "YouTube Video" : sourceMeta.type}
                </div>
                <div className="text-sm text-white font-bold truncate">{sourceMeta.title}</div>
                {(sourceMeta.timestamp != null || sourceMeta.url) && (
                  <div className="text-[10px] text-gray-400 font-medium">
                    {sourceMeta.timestamp != null && `Timestamp: ${Math.floor((sourceMeta.timestamp ?? 0) / 60)}:${String((sourceMeta.timestamp ?? 0) % 60).padStart(2, "0")}`}
                    {sourceMeta.timestamp != null && sourceMeta.url && " · "}
                    {sourceMeta.url && <span className="truncate block max-w-[200px]">{sourceMeta.url}</span>}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSourceMeta(null)}
                className="text-gray-600 hover:text-white transition-colors p-2"
                aria-label="Remove source"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          )}
          {showAddSource ? (
            <div className="bg-app-bg p-5 rounded-2xl border border-white/5 space-y-3">
              <select
                value={sourceForm.type}
                onChange={(e) => setSourceForm((s) => ({ ...s, type: e.target.value }))}
                className="input-dark w-full py-2 px-3 rounded-lg text-sm"
              >
                <option value="youtube">YouTube Video</option>
                <option value="book">Book</option>
              </select>
              <input
                type="text"
                value={sourceForm.title}
                onChange={(e) => setSourceForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Title"
                className="input-dark w-full py-2 px-3 rounded-lg text-sm"
              />
              {sourceForm.type === "youtube" && (
                <>
                  <input
                    type="url"
                    value={sourceForm.url}
                    onChange={(e) => setSourceForm((s) => ({ ...s, url: e.target.value }))}
                    placeholder="URL"
                    className="input-dark w-full py-2 px-3 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    value={sourceForm.timestamp || ""}
                    onChange={(e) => setSourceForm((s) => ({ ...s, timestamp: e.target.value ? Number(e.target.value) : 0 }))}
                    placeholder="Timestamp (seconds)"
                    className="input-dark w-full py-2 px-3 rounded-lg text-sm"
                  />
                </>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const meta: SourceMetaDto = {
                      type: sourceForm.type,
                      title: sourceForm.title || sourceForm.type,
                      ...(sourceForm.type === "youtube" && sourceForm.url ? { url: sourceForm.url, timestamp: sourceForm.timestamp || undefined, service: "youtube" } : {}),
                    };
                    setSourceMeta(meta);
                    setShowAddSource(false);
                    setSourceForm({ type: "youtube", title: "", url: "", timestamp: 0 });
                  }}
                  className="btn-primary py-2 px-4 text-sm"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddSource(false); setSourceForm({ type: "youtube", title: "", url: "", timestamp: 0 }); }}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddSource(true)}
              className="w-full py-3.5 bg-app-bg hover:bg-app-hover border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus" /> Add Source Reference
            </button>
          )}
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !selectedDeckId}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Card"}
        </button>
      </div>
    </form>
  );
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

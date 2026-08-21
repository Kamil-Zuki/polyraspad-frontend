import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { StudyCard } from "./study-card";

import { SENTENCE_MINING } from "@/lib/editor/sentence-mining-keys";

vi.mock("@/components/editor/card-preview", () => ({
  PreviewImage: ({ src, alt }: { src: string; alt?: string }) => <img src={src} alt={alt ?? "preview"} />,
}));

describe("StudyCard", () => {
  afterEach(cleanup);

  const defaultProps = {
    sentence: "Hello world",
    targetWord: "world",
    backSections: [
      {
        key: SENTENCE_MINING.Translation,
        label: "Translation",
        value: "Привет мир",
      },
    ],
    isRevealed: false,
    onReveal: vi.fn(),
  };

  it("shows reveal hint when not revealed", () => {
    render(<StudyCard {...defaultProps} />);
    expect(screen.getByText(/click the card/i)).toBeInTheDocument();
  });

  it("hides reveal hint when revealed", () => {
    render(<StudyCard {...defaultProps} isRevealed={true} />);
    expect(screen.queryByText(/click the card/i)).not.toBeInTheDocument();
  });

  it("renders the card image when media is available", () => {
    render(
      <StudyCard
        {...defaultProps}
        imageSrc="http://localhost:5000/api/Media/serve-image?id=img-1"
      />
    );

    expect(screen.getByAltText("Card")).toHaveAttribute(
      "src",
      "http://localhost:5000/api/Media/serve-image?id=img-1"
    );
  });

  it("uses_highlightRange_for_exact_span_when_word_field_would_false_match_inside_larger_token", () => {
    const { container } = render(
      <StudyCard
        {...defaultProps}
        sentence="How to Apply These Ideas to Business"
        targetWord="deas"
        highlightRange={{ start: "How to Apply These Ideas to Business".indexOf("Ideas"), len: 5 }}
      />
    );
    const spans = container.querySelectorAll("span.border-b-2");
    expect(spans.length).toBe(1);
    expect(spans[0].textContent).toBe("Ideas");
  });

  it("does_not_highlight_when_substring_has_no_whole_word_match_and_no_range", () => {
    const { container } = render(
      <StudyCard
        {...defaultProps}
        sentence="How to Apply These Ideas to Business"
        targetWord="deas"
      />
    );
    expect(container.querySelector("span.border-b-2")).toBeNull();
  });

  it("shows_back_sections_and_native_audio_when_revealed", () => {
    render(
      <StudyCard
        {...defaultProps}
        isRevealed
        audioSrc="https://example.com/audio.mp3"
        backSections={[
          { key: SENTENCE_MINING.Word, label: "Word", value: "world" },
          { key: SENTENCE_MINING.Transcription, label: "Transcription", value: "/wɜːld/" },
          { key: SENTENCE_MINING.Definition, label: "Definition", value: "(noun) Planet Earth." },
        ]}
      />
    );

    expect(screen.getByText("Word")).toBeInTheDocument();
    expect(screen.getByText(/\/wɜːld\//)).toBeInTheDocument();
    expect(screen.getByText(/Planet Earth/)).toBeInTheDocument();
    const audio = document.querySelector("audio");
    expect(audio).not.toBeNull();
    expect(audio).toHaveAttribute("src", "https://example.com/audio.mp3");
  });

  it("does not render Practice pronunciation link when revealed", () => {
    render(
      <StudyCard
        {...defaultProps}
        isRevealed={true}
        cardId="card-123"
      />
    );
    expect(screen.queryByText(/practice pronunciation/i)).not.toBeInTheDocument();
  });

  it("renders browser TTS button for sentence and triggers speechSynthesis", () => {
    const speakMock = vi.fn();
    const cancelMock = vi.fn();
    const originalSpeechSynthesis = window.speechSynthesis;

    class MockSpeechSynthesisUtterance {
      text: string;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    (globalThis as unknown as { SpeechSynthesisUtterance: typeof MockSpeechSynthesisUtterance }).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance;

    Object.defineProperty(window, "speechSynthesis", {
      writable: true,
      value: {
        speak: speakMock,
        cancel: cancelMock,
        speaking: false,
      },
    });

    render(<StudyCard {...defaultProps} sentence="Testing sentence TTS" />);

    const ttsButton = screen.getByRole("button", { name: /listen sentence/i });
    expect(ttsButton).toBeInTheDocument();

    ttsButton.click();
    expect(cancelMock).toHaveBeenCalled();
    expect(speakMock).toHaveBeenCalled();

    Object.defineProperty(window, "speechSynthesis", {
      writable: true,
      value: originalSpeechSynthesis,
    });
  });
});

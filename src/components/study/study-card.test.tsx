import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { StudyCard } from "./study-card";

describe("StudyCard", () => {
  afterEach(cleanup);

  const defaultProps = {
    sentence: "Hello world",
    targetWord: "world",
    translation: "Привет мир",
    isRevealed: false,
    onReveal: vi.fn(),
    userAnswer: "",
    onAnswerChange: vi.fn(),
    onEnter: vi.fn(),
  };

  it("renders an input field when not revealed", () => {
    render(<StudyCard {...defaultProps} />);
    const input = screen.getByPlaceholderText(/type your answer/i);
    expect(input).toBeInTheDocument();
  });

  it("calls onAnswerChange when typing in the input", () => {
    render(<StudyCard {...defaultProps} />);
    const input = screen.getByPlaceholderText(/type your answer/i);
    fireEvent.change(input, { target: { value: "world" } });
    expect(defaultProps.onAnswerChange).toHaveBeenCalledWith("world");
  });

  it("calls onEnter when Enter is pressed in the input", () => {
    render(<StudyCard {...defaultProps} />);
    const input = screen.getByPlaceholderText(/type your answer/i);
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(defaultProps.onEnter).toHaveBeenCalled();
  });

  it("hides the input field when revealed", () => {
    render(<StudyCard {...defaultProps} isRevealed={true} />);
    const input = screen.queryByPlaceholderText(/type your answer/i);
    expect(input).not.toBeInTheDocument();
  });
});

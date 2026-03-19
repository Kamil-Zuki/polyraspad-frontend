import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { StudyControls } from "./study-controls";

describe("StudyControls", () => {
  afterEach(cleanup);

  const defaultProps = {
    onRate: vi.fn(),
    isRevealed: false,
    onReveal: vi.fn(),
    onUndo: vi.fn(),
    canUndo: true,
    disabled: false,
  };

  it("calls onReveal when Space is pressed and focus is not in an input", () => {
    render(<StudyControls {...defaultProps} />);
    fireEvent.keyDown(window, { code: "Space" });
    expect(defaultProps.onReveal).toHaveBeenCalled();
  });

  it("does not call onReveal when Space is pressed and focus is in an input", () => {
    render(<StudyControls {...defaultProps} />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    
    fireEvent.keyDown(input, { code: "Space", bubbles: true });
    
    expect(defaultProps.onReveal).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});

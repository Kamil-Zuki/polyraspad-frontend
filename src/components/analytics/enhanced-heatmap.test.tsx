import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { EnhancedHeatmap } from "./enhanced-heatmap";

describe("EnhancedHeatmap", () => {
  afterEach(cleanup);

  it("shows formatted date and review count on hover", () => {
    render(
      <EnhancedHeatmap
        year={2026}
        totalReviews={12}
        activity={{
          "2026-03-15": { count: 5, level: 3 },
        }}
      />
    );

    const cell = screen.getByRole("img", { name: /Mar 15, 2026: 5 reviews/i });
    fireEvent.mouseEnter(cell);

    expect(screen.getByText(/Mar 15, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/5 reviews/i)).toBeInTheDocument();
  });

  it("shows no reviews message when hovered day has zero activity", () => {
    render(
      <EnhancedHeatmap
        year={2026}
        totalReviews={0}
        activity={{}}
      />
    );

    const cell = screen.getByRole("img", { name: /Jan 1, 2026: 0 reviews/i });
    fireEvent.mouseEnter(cell);

    expect(screen.getByText(/Jan 1, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/No reviews/i)).toBeInTheDocument();
  });

  it("keeps date visible when moving between cells without flickering to empty", () => {
    render(
      <EnhancedHeatmap
        year={2026}
        totalReviews={12}
        activity={{
          "2026-03-15": { count: 5, level: 3 },
        }}
      />
    );

    const marchCell = screen.getByRole("img", { name: /Mar 15, 2026: 5 reviews/i });
    const janCell = screen.getByRole("img", { name: /Jan 1, 2026: 0 reviews/i });

    fireEvent.mouseEnter(marchCell);
    expect(screen.getByText(/Mar 15, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/5 reviews/i)).toBeInTheDocument();

    fireEvent.mouseEnter(janCell);
    expect(screen.getByText(/Jan 1, 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/No reviews/i)).toBeInTheDocument();
  });

  it("shows a default date line before any hover", () => {
    render(
      <EnhancedHeatmap
        year={2025}
        totalReviews={0}
        activity={{}}
      />
    );

    expect(screen.getByText(/Jan 1, 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/No reviews/i)).toBeInTheDocument();
  });
});

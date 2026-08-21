import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VocabularyStats } from "./vocabulary-stats";

const baseProps = {
  totalTerms: 10,
  matureCount: 3,
  savedCount: 4,
  reviewingCount: 3,
  learningCount: 7,
  newCount: 0,
  cefrLevel: {
    code: "A1",
    title: "Beginner",
    progressPercent: 0,
    wordsToNextLevel: 497,
  },
  estimatedFluency: 0,
};

describe("VocabularyStats", () => {
  afterEach(cleanup);

  it("uses status counts when totalTerms is zero so distribution is not NaN", () => {
    render(
      <VocabularyStats
        totalTerms={0}
        matureCount={3}
        savedCount={2}
        reviewingCount={1}
        learningCount={3}
        newCount={1}
        cefrLevel={{ code: "A2", title: "Elementary", progressPercent: 40, wordsToNextLevel: 420 }}
        estimatedFluency={25}
      />
    );

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Known terms share")).toBeInTheDocument();
    expect(screen.getByText("43%")).toBeInTheDocument();
    expect(screen.getAllByText(/3 \(43%\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2 \(29%\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1 \(14%\)/).length).toBe(2);
  });

  it("shows explanatory copy for known terms and learning pipeline", () => {
    render(<VocabularyStats {...baseProps} />);

    expect(
      screen.getByText(/Known includes words marked known in Reader and words matured through FSRS review/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Known drives your level estimate/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText("Known").length).toBeGreaterThan(0);
    expect(screen.getAllByText("In Review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Saved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("New").length).toBeGreaterThan(0);
  });

  it("shows separate In Review and Saved counts", () => {
    render(<VocabularyStats {...baseProps} />);

    expect(screen.getAllByText("In Review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Saved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
  });

  it("shows next-level progress copy with wordsToNextLevel", () => {
    render(<VocabularyStats {...baseProps} />);

    expect(screen.getByText(/3 \/ 500 known terms toward A2/i)).toBeInTheDocument();
    expect(screen.getByText(/497 more known terms needed/i)).toBeInTheDocument();
    expect(screen.getByText(/early progress/i)).toBeInTheDocument();
  });

  it("renders stacked distribution legend with percentages", () => {
    render(<VocabularyStats {...baseProps} />);

    expect(screen.getAllByText(/3 \(30%\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4 \(40%\)/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/0 \(0%\)/).length).toBeGreaterThan(0);
  });

  it("shows empty-state guidance when there are no terms", () => {
    render(
      <VocabularyStats
        totalTerms={0}
        matureCount={0}
        savedCount={0}
        reviewingCount={0}
        learningCount={0}
        newCount={0}
        cefrLevel={{ code: "A1", title: "Beginner", progressPercent: 0, wordsToNextLevel: 500 }}
        estimatedFluency={0}
      />
    );

    expect(screen.getByText(/Read, save terms, or create FSRS cards/i)).toBeInTheDocument();
    expect(screen.queryByText("Distribution")).not.toBeInTheDocument();
  });

  it("falls back when wordsToNextLevel is missing from API response", () => {
    render(
      <VocabularyStats
        {...baseProps}
        cefrLevel={{
          code: "A1",
          title: "Beginner",
          progressPercent: 1,
        }}
      />
    );

    expect(screen.getByText(/0 more known terms needed/i)).toBeInTheDocument();
  });
});

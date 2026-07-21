import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionCardSkeleton } from "./QuestionCardSkeleton";

describe("QuestionCardSkeleton", () => {
  it("renders a title placeholder and one placeholder per frequency-scale option", () => {
    render(<QuestionCardSkeleton />);
    expect(screen.getAllByTestId("skeleton")).toHaveLength(5);
  });
});

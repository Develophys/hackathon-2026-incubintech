import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("renders a pulsing gray block", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton")).toHaveClass("animate-pulse", "bg-line");
  });

  it("merges a custom className for sizing and shape", () => {
    render(<Skeleton className="h-4 w-20 rounded-pill" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("h-4", "w-20", "rounded-pill");
  });
});

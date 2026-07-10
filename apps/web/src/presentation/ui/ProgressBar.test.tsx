import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("sets the fill width from the value prop", () => {
    render(<ProgressBar value={33} />);
    expect(screen.getByTestId("progress-fill")).toHaveStyle({ width: "33%" });
  });

  it("exposes progressbar role with correct aria attributes", () => {
    render(<ProgressBar value={50} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });
});

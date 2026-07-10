import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreDial } from "./ScoreDial";

describe("ScoreDial", () => {
  it("renders the score, max, and band label", () => {
    render(<ScoreDial score={12} max={27} band={{ label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" }} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("/27")).toBeInTheDocument();
    expect(screen.getByText("Moderado")).toBeInTheDocument();
  });

  it("applies the band colors as inline style on the band pill", () => {
    render(<ScoreDial score={12} max={27} band={{ label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" }} />);
    const pill = screen.getByText("Moderado");
    expect(pill).toHaveStyle({ color: "rgb(169, 113, 26)", backgroundColor: "rgb(246, 237, 218)" });
  });
});

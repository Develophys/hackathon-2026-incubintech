import { describe, expect, it } from "vitest";
import { bandFor } from "./band-for";

describe("bandFor", () => {
  it.each([
    [4, "Mínimo"],
    [5, "Leve"],
    [9, "Leve"],
    [10, "Moderado"],
    [14, "Moderado"],
    [15, "Moderadamente grave"],
    [19, "Moderadamente grave"],
    [20, "Grave"],
    [27, "Grave"],
  ])("PHQ-9 score %i maps to band %s", (score, label) => {
    expect(bandFor("PHQ-9", score).label).toBe(label);
  });

  it.each([
    [4, "Mínimo"],
    [5, "Leve"],
    [9, "Leve"],
    [10, "Moderado"],
    [14, "Moderado"],
    [15, "Grave"],
    [21, "Grave"],
  ])("GAD-7 score %i maps to band %s", (score, label) => {
    expect(bandFor("GAD-7", score).label).toBe(label);
  });

  it("returns fg/bg colors alongside the label", () => {
    const band = bandFor("PHQ-9", 12);
    expect(band).toEqual({ label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" });
  });
});

export interface ScoreBand {
  label: string;
  fg: string;
  bg: string;
}

interface BandEntry {
  max: number;
  band: ScoreBand;
}

const PHQ9_BANDS: BandEntry[] = [
  { max: 4, band: { label: "Mínimo", fg: "#2F6B5E", bg: "#E3ECE7" } },
  { max: 9, band: { label: "Leve", fg: "#3F7D5C", bg: "#E5EFE6" } },
  { max: 14, band: { label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" } },
  { max: 19, band: { label: "Moderadamente grave", fg: "#A2453A", bg: "#F7EBE8" } },
  { max: 27, band: { label: "Grave", fg: "#8F2F26", bg: "#F5E4E1" } },
];

const GAD7_BANDS: BandEntry[] = [
  { max: 4, band: { label: "Mínimo", fg: "#2F6B5E", bg: "#E3ECE7" } },
  { max: 9, band: { label: "Leve", fg: "#3F7D5C", bg: "#E5EFE6" } },
  { max: 14, band: { label: "Moderado", fg: "#A9711A", bg: "#F6EDDA" } },
  { max: 21, band: { label: "Grave", fg: "#8F2F26", bg: "#F5E4E1" } },
];

export function bandFor(scaleType: "PHQ-9" | "GAD-7", score: number): ScoreBand {
  const bands = scaleType === "PHQ-9" ? PHQ9_BANDS : GAD7_BANDS;
  const match = bands.find((entry) => score <= entry.max);
  return (match ?? bands[bands.length - 1]!).band;
}

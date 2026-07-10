interface ScoreDialProps {
  score: number;
  max: number;
  band: { label: string; fg: string; bg: string };
}

export function ScoreDial({ score, max, band }: ScoreDialProps) {
  return (
    <div className="text-center">
      <span className="font-serif text-score text-ink">{score}</span>
      <span className="text-[24px] text-faint">/{max}</span>
      <div className="mt-3">
        <span
          className="inline-block rounded-pill px-4 py-[7px] font-sans text-label font-extrabold"
          style={{ color: band.fg, backgroundColor: band.bg }}
        >
          {band.label}
        </span>
      </div>
    </div>
  );
}

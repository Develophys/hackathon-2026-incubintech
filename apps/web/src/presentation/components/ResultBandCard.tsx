import { Card } from "../ui/Card";
import { ScoreDial } from "../ui/ScoreDial";
import type { ScoreBand } from "../lib/band-for";

interface ResultBandCardProps {
  scaleType: "PHQ-9" | "GAD-7";
  score: number;
  max: number;
  band: ScoreBand;
}

export function ResultBandCard({ scaleType, score, max, band }: ResultBandCardProps) {
  return (
    <Card size="lg" className="text-center">
      <p className="text-caption text-muted-2">Sua pontuação {scaleType}</p>
      <div className="mt-2">
        <ScoreDial score={score} max={max} band={band} />
      </div>
    </Card>
  );
}

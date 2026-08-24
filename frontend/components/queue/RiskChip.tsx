import { getRiskColors, getRiskLabel } from "@/lib/riskUtils";

interface RiskChipProps {
  score: number;
}

export default function RiskChip({ score }: RiskChipProps) {
  const { bg, text, border } = getRiskColors(score);
  const label = getRiskLabel(score);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${bg} ${text} ${border}`}
      aria-label={`Risk score: ${score} — ${label}`}
    >
      <span className="tabular-nums">{score}</span>
      <span>— {label}</span>
    </span>
  );
}

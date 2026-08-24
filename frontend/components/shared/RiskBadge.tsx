import { getRiskColors, getRiskLabel } from "@/lib/riskUtils";

interface RiskBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export default function RiskBadge({ score, size = "md" }: RiskBadgeProps) {
  const { bg, text, border } = getRiskColors(score);
  const label = getRiskLabel(score);

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}
        aria-label={`Risk level: ${label}, score ${score}`}
      >
        {score} — {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${bg} ${text} ${border}`}
      aria-label={`Risk level: ${label}, score ${score}`}
    >
      {score}/100 — {label}
    </span>
  );
}

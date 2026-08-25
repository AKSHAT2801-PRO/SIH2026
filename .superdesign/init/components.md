# Shared UI Components

## RiskBadge
- **File**: `frontend/components/shared/RiskBadge.tsx`
- **Description**: Displays color-coded risk badge with score and severity label.
- **Props**: `score` (number), `size` ('sm' | 'md')

```tsx
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
```

## EmptyState
- **File**: `frontend/components/shared/EmptyState.tsx`
- **Description**: Rendered when lists or tables have no matching results.

```tsx
interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = "No works found",
  message = "Try adjusting filters or search query.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 text-center">
      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{message}</p>
    </div>
  );
}
```

## SkeletonCard
- **File**: `frontend/components/shared/SkeletonCard.tsx`
- **Description**: Loading placeholder card with pulsing animation.

```tsx
export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 skeleton-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-8 bg-slate-200 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  );
}
```

import { Work } from "@/types";
import { formatCurrency } from "@/lib/riskUtils";

interface KeyFactsPanelProps {
  work: Work;
}

interface ComparisonBarProps {
  label1: string;
  value1: number;
  label2: string;
  value2: number;
  prefix?: string;
  suffix?: string;
  unit?: string;
  overThreshold?: number; // value2 above this % of value1 is amber/red
}

function ComparisonBar({
  label1,
  value1,
  label2,
  value2,
  prefix = "",
  suffix = "",
  unit = "",
  overThreshold = 10,
}: ComparisonBarProps) {
  const max = Math.max(value1, value2) * 1.1;
  const pct1 = (value1 / max) * 100;
  const pct2 = (value2 / max) * 100;
  const overrun = ((value2 - value1) / value1) * 100;
  const isOver = overrun > overThreshold;
  const barColor2 = isOver
    ? overrun > 25
      ? "bg-red-500"
      : "bg-amber-500"
    : "bg-green-500";
  const textColor2 = isOver
    ? overrun > 25
      ? "text-red-600"
      : "text-amber-600"
    : "text-green-600";

  return (
    <div className="space-y-2">
      {/* Bar 1 */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-slate-500">{label1}</span>
          <span className="text-sm font-bold text-slate-800 tabular-nums">
            {prefix}{value1.toFixed(unit === "L" ? 1 : 0)}{suffix}
          </span>
        </div>
        <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-400 rounded-full transition-all"
            style={{ width: `${pct1}%` }}
            role="progressbar"
            aria-valuenow={value1}
            aria-label={label1}
          />
        </div>
      </div>

      {/* Bar 2 */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-slate-500">{label2}</span>
          <span className={`text-sm font-bold tabular-nums ${textColor2}`}>
            {prefix}{value2.toFixed(unit === "L" ? 1 : 0)}{suffix}
            {isOver && (
              <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-current/10">
                +{overrun.toFixed(1)}%
              </span>
            )}
          </span>
        </div>
        <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor2}`}
            style={{ width: `${pct2}%` }}
            role="progressbar"
            aria-valuenow={value2}
            aria-label={label2}
          />
        </div>
      </div>
    </div>
  );
}

export default function KeyFactsPanel({ work }: KeyFactsPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-5">Key Facts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial comparison */}
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">
            Financial (₹ lakhs)
          </p>
          <ComparisonBar
            label1="Sanctioned Amount"
            value1={work.sanctionedAmount}
            label2="Reported Expenditure"
            value2={work.reportedExpenditure}
            prefix="₹"
            suffix="L"
            unit="L"
            overThreshold={10}
          />
          {work.reportedExpenditure > work.sanctionedAmount && (
            <p className="text-xs text-slate-500 mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
              <strong className="text-amber-700">Note:</strong> Expenditure exceeds sanction by{" "}
              <strong className="text-amber-700">
                ₹{(work.reportedExpenditure - work.sanctionedAmount).toFixed(1)}L
              </strong>
              . Re-estimate approval required above 10% variance.
            </p>
          )}
        </div>

        {/* Timeline comparison */}
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">
            Timeline (days)
          </p>
          <ComparisonBar
            label1="Expected Duration"
            value1={work.expectedDuration}
            label2="Actual Duration"
            value2={work.actualDuration}
            suffix=" days"
            overThreshold={15}
          />
          {work.actualDuration > work.expectedDuration && (
            <p className="text-xs text-slate-500 mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
              <strong className="text-amber-700">Note:</strong> Overrun of{" "}
              <strong className="text-amber-700">
                {work.actualDuration - work.expectedDuration} days
              </strong>{" "}
              (
              {(
                ((work.actualDuration - work.expectedDuration) / work.expectedDuration) *
                100
              ).toFixed(0)}
              %). Extension application status: not on record.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

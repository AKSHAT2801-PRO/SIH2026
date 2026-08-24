import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: "default" | "red" | "amber" | "green";
}

const accentMap = {
  default: { icon: "bg-sky-50 text-sky-600", value: "text-slate-900" },
  red: { icon: "bg-red-50 text-red-600", value: "text-red-700" },
  amber: { icon: "bg-amber-50 text-amber-600", value: "text-amber-700" },
  green: { icon: "bg-green-50 text-green-600", value: "text-green-700" },
};

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "default",
}: StatCardProps) {
  const colors = accentMap[accent];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon}`}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className={`text-3xl font-bold tabular-nums ${colors.value}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

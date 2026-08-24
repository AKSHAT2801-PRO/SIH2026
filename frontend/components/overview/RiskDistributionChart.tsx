"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";

interface RiskDistributionChartProps {
  data: { band: string; count: number; color: string }[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { band: string } }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
        <p className="font-semibold">{payload[0].payload.band}</p>
        <p>{payload[0].value} works</p>
      </div>
    );
  }
  return null;
};

export default function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Risk Distribution</h2>
        <p className="text-xs text-slate-500 mt-0.5">Works by risk band</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="band"
            width={70}
            tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              style={{ fontSize: 12, fontWeight: 600, fill: "#475569" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

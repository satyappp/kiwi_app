"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HarvestBreakdown, HarvestChartPoint } from "@/features/harvest/schema";

const chartColors = ["#78a948", "#a9cb67", "#d6df75", "#f2cf66", "#85b9a1"];

function EmptyChart() {
  return (
    <div className="grid h-64 place-items-center text-sm text-muted-foreground">
      この期間の収穫データはありません。
    </div>
  );
}

export function HarvestWeightChart({ data }: { data: HarvestChartPoint[] }) {
  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#dfe9d9" strokeDasharray="4 4" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7c8c78", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7c8c78", fontSize: 12 }} width={54} />
          <Tooltip
            cursor={{ fill: "rgba(200,230,160,.18)" }}
            formatter={(value) => [`${Number(value).toLocaleString("ja-JP")} kg`, "収穫量"]}
            contentStyle={{ borderRadius: 14, borderColor: "#dfe9d9", boxShadow: "0 10px 30px rgba(55,75,35,.1)" }}
          />
          <Bar dataKey="weightKg" fill="#78a948" radius={[7, 7, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HarvestVarietyChart({ data }: { data: HarvestBreakdown[] }) {
  if (data.length === 0) return <EmptyChart />;
  const displayed = data.slice(0, 5);
  const total = displayed.reduce((sum, item) => sum + item.weightKg, 0);

  return (
    <div className="grid items-center gap-3 sm:grid-cols-[minmax(180px,0.8fr)_1fr]">
      <div className="relative h-56 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={displayed} dataKey="weightKg" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none">
              {displayed.map((item, index) => (
                <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${Number(value).toLocaleString("ja-JP")} kg`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <strong className="text-xl text-kiwi-ink">{total.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}</strong>
          <span className="text-xs text-muted-foreground">kg</span>
        </div>
      </div>
      <ul className="space-y-2.5">
        {displayed.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
            <strong className="tabular-nums text-kiwi-ink">
              {item.weightKg.toLocaleString("ja-JP", { maximumFractionDigits: 1 })} kg
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

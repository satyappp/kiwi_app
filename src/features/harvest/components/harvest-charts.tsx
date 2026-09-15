"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HarvestChartPoint } from "@/features/harvest/schema";

function EmptyChart() {
  return (
    <div className="grid h-56 place-items-center text-sm text-muted-foreground">
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

export function HarvestMonthlyLineChart({ data }: { data: HarvestChartPoint[] }) {
  if (data.length === 0) return <EmptyChart />;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 12, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="harvest-line-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#78a948" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#78a948" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#dfe9d9" strokeDasharray="4 4" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7c8c78", fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7c8c78", fontSize: 11 }} width={54} />
          <Tooltip
            formatter={(value) => [`${Number(value).toLocaleString("ja-JP")} kg`, "収穫量"]}
            contentStyle={{ borderRadius: 14, borderColor: "#dfe9d9", boxShadow: "0 10px 30px rgba(55,75,35,.1)" }}
          />
          <Area
            type="monotone"
            dataKey="weightKg"
            stroke="#6f9f43"
            strokeWidth={3}
            fill="url(#harvest-line-fill)"
            activeDot={{ r: 5, fill: "#557f3e", stroke: "white", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

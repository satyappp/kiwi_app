"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ShippingSaleRow } from "@/features/shipping/schema";

const ALL_VARIETIES = "all";
type Granularity = "month" | "year";

function formatWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function ShippingDataAnalytics({ rows }: { rows: ShippingSaleRow[] }) {
  const [selectedVariety, setSelectedVariety] = useState(ALL_VARIETIES);
  const [granularity, setGranularity] = useState<Granularity>("month");
  const activeRows = useMemo(
    () => rows.filter((row) => row.status !== "cancelled"),
    [rows],
  );
  const varieties = useMemo(
    () => [...new Set(activeRows.map((row) => row.varietyName))].sort((a, b) => a.localeCompare(b, "ja")),
    [activeRows],
  );
  const filteredRows = useMemo(
    () => activeRows.filter((row) => selectedVariety === ALL_VARIETIES || row.varietyName === selectedVariety),
    [activeRows, selectedVariety],
  );

  const points = useMemo(() => {
    if (filteredRows.length === 0) return [];
    const latestMonth = filteredRows.map((row) => row.shippingDate.slice(0, 7)).sort((a, b) => b.localeCompare(a))[0];
    const [latestYear, latestMonthNumber] = latestMonth.split("-").map(Number);
    const periods = new Map<string, { quantityKg: number; salesYen: number; recordCount: number }>();
    if (granularity === "month") {
      for (let offset = 11; offset >= 0; offset -= 1) {
        const date = new Date(Date.UTC(latestYear, latestMonthNumber - 1 - offset, 1));
        periods.set(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`, { quantityKg: 0, salesYen: 0, recordCount: 0 });
      }
    } else {
      for (let offset = 4; offset >= 0; offset -= 1) periods.set(String(latestYear - offset), { quantityKg: 0, salesYen: 0, recordCount: 0 });
    }
    for (const row of filteredRows) {
      const key = row.shippingDate.slice(0, granularity === "month" ? 7 : 4);
      const current = periods.get(key);
      if (!current) continue;
      current.quantityKg += row.quantityKg;
      current.salesYen += row.totalPriceYen;
      current.recordCount += 1;
    }
    return [...periods.entries()].map(([period, value]) => ({
      label: granularity === "month" ? `${Number(period.slice(0, 4))}/${Number(period.slice(5, 7))}` : `${period}年`,
      ...value,
    }));
  }, [filteredRows, granularity]);

  const totalQuantity = points.reduce((sum, point) => sum + point.quantityKg, 0);
  const totalSales = points.reduce((sum, point) => sum + point.salesYen, 0);
  const totalRecords = points.reduce((sum, point) => sum + point.recordCount, 0);

  return <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)] sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><h2 className="text-lg font-bold text-kiwi-ink">{granularity === "month" ? "月別" : "年別"}出荷量・売上の推移</h2></div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="inline-flex self-start rounded-xl bg-kiwi-pale/30 p-1">{(["month", "year"] as const).map((value) => <button key={value} type="button" aria-pressed={granularity === value} onClick={() => setGranularity(value)} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${granularity === value ? "bg-white text-kiwi-ink shadow-sm" : "text-muted-foreground hover:text-kiwi-ink"}`}>{value === "month" ? "月別" : "年別"}</button>)}</div>
        <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">品種<select value={selectedVariety} onChange={(event) => setSelectedVariety(event.target.value)} className="h-10 min-w-44 rounded-xl border border-border bg-white px-3 text-sm font-bold text-kiwi-ink outline-none focus:border-kiwi focus:ring-2 focus:ring-kiwi/15"><option value={ALL_VARIETIES}>すべての品種</option>{varieties.map((variety) => <option key={variety} value={variety}>{variety}</option>)}</select></label>
      </div>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">{[["期間内の出荷量", `${formatWeight(totalQuantity)} kg`], ["期間内の売上", `¥${Math.round(totalSales).toLocaleString("ja-JP")}`], ["出荷記録", `${totalRecords.toLocaleString("ja-JP")} 件`]].map(([label, value]) => <div key={label} className="rounded-xl bg-kiwi-pale/20 px-4 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold tabular-nums text-kiwi-ink">{value}</p></div>)}</div>
    {points.length === 0 ? <div className="grid h-72 place-items-center text-sm text-muted-foreground">出荷データはありません。</div> : <div className="mt-5 h-72 w-full"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={points} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="#dfe9d9" strokeDasharray="4 4" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7c8c78", fontSize: 11 }} /><YAxis yAxisId="weight" axisLine={false} tickLine={false} tick={{ fill: "#7c8c78", fontSize: 11 }} width={54} unit="kg" /><YAxis yAxisId="sales" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#7c8c78", fontSize: 11 }} width={64} tickFormatter={(value) => `¥${Number(value).toLocaleString("ja-JP", { notation: "compact" })}`} /><Tooltip formatter={(value, name) => name === "出荷量" ? [`${formatWeight(Number(value))} kg`, name] : [`¥${Number(value).toLocaleString("ja-JP")}`, name]} contentStyle={{ borderRadius: 14, borderColor: "#dfe9d9", boxShadow: "0 10px 30px rgba(55,75,35,.1)" }} /><Legend /><Bar yAxisId="weight" dataKey="quantityKg" name="出荷量" fill="#78a948" radius={[5, 5, 0, 0]} maxBarSize={38} /><Line yAxisId="sales" type="monotone" dataKey="salesYen" name="売上金額" stroke="#d59b35" strokeWidth={3} dot={{ r: 3, fill: "#d59b35" }} /></ComposedChart></ResponsiveContainer></div>}
  </section>;
}

"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  SortingAnalyticsEntry,
  SortingChartPoint,
} from "@/features/sorting/schema";

const ALL_VARIETIES = "all";
const SIZE_ORDER = ["5L", "4L", "3L", "LL", "2L", "L", "M", "S", "SS", "奇形"];
type ChartGranularity = "month" | "year";

function formatWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function SortingDataAnalytics({
  entries,
}: {
  entries: SortingAnalyticsEntry[];
}) {
  const [selectedVariety, setSelectedVariety] = useState(ALL_VARIETIES);
  const [granularity, setGranularity] = useState<ChartGranularity>("month");
  const varieties = useMemo(
    () =>
      [...new Set(entries.map((entry) => entry.varietyName))].sort((a, b) =>
        a.localeCompare(b, "ja"),
      ),
    [entries],
  );
  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          selectedVariety === ALL_VARIETIES ||
          entry.varietyName === selectedVariety,
      ),
    [entries, selectedVariety],
  );

  const analytics = useMemo(() => {
    if (filteredEntries.length === 0) {
      return {
        points: [] as SortingChartPoint[],
        sizeTotals: [] as Array<{ sizeCode: string; weightKg: number }>,
      };
    }

    const latestMonth = filteredEntries
      .map((entry) => entry.month)
      .sort((a, b) => b.localeCompare(a))[0];
    const [latestYear, latestMonthNumber] = latestMonth.split("-").map(Number);
    const periodTotals = new Map<string, number>();

    if (granularity === "month") {
      for (let offset = 11; offset >= 0; offset -= 1) {
        const date = new Date(
          Date.UTC(latestYear, latestMonthNumber - 1 - offset, 1),
        );
        const key = `${date.getUTCFullYear()}-${String(
          date.getUTCMonth() + 1,
        ).padStart(2, "0")}`;
        periodTotals.set(key, 0);
      }
    } else {
      for (let offset = 4; offset >= 0; offset -= 1) {
        periodTotals.set(String(latestYear - offset), 0);
      }
    }

    const keyFor = (entry: SortingAnalyticsEntry) =>
      entry.month.slice(0, granularity === "month" ? 7 : 4);
    const periodEntries = filteredEntries.filter((entry) =>
      periodTotals.has(keyFor(entry)),
    );
    const sizes = new Map<string, number>();

    for (const entry of periodEntries) {
      const key = keyFor(entry);
      periodTotals.set(key, (periodTotals.get(key) ?? 0) + entry.weightKg);
      sizes.set(entry.sizeCode, (sizes.get(entry.sizeCode) ?? 0) + entry.weightKg);
    }

    return {
      points: [...periodTotals.entries()].map(
        ([period, weightKg]): SortingChartPoint => ({
          label:
            granularity === "month"
              ? `${Number(period.slice(0, 4))}/${Number(period.slice(5, 7))}`
              : `${period}年`,
          weightKg,
        }),
      ),
      sizeTotals: [...sizes.entries()]
        .map(([sizeCode, weightKg]) => ({ sizeCode, weightKg }))
        .sort((a, b) => {
          const aIndex = SIZE_ORDER.indexOf(a.sizeCode);
          const bIndex = SIZE_ORDER.indexOf(b.sizeCode);
          return (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex);
        }),
    };
  }, [filteredEntries, granularity]);

  const maxSizeWeight = Math.max(
    0,
    ...analytics.sizeTotals.map((item) => item.weightKg),
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <article className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)] sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-kiwi-ink">
              {granularity === "month" ? "月別" : "年別"}選果量の推移
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              品種と表示単位を選んで、選果量の変化を確認できます
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex self-start rounded-xl bg-kiwi-pale/30 p-1">
              {(["month", "year"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={granularity === value}
                  onClick={() => setGranularity(value)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition ${
                    granularity === value
                      ? "bg-white text-kiwi-ink shadow-sm"
                      : "text-muted-foreground hover:text-kiwi-ink"
                  }`}
                >
                  {value === "month" ? "月別" : "年別"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              品種
              <select
                value={selectedVariety}
                onChange={(event) => setSelectedVariety(event.target.value)}
                className="h-10 min-w-40 rounded-xl border border-border bg-white px-3 text-sm font-bold text-kiwi-ink outline-none focus:border-kiwi focus:ring-2 focus:ring-kiwi/15"
              >
                <option value={ALL_VARIETIES}>すべての品種</option>
                {varieties.map((variety) => (
                  <option key={variety} value={variety}>
                    {variety}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {analytics.points.length === 0 ? (
          <div className="grid h-60 place-items-center text-sm text-muted-foreground">
            この期間の選果データはありません。
          </div>
        ) : (
          <div className="mt-3 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics.points}
                margin={{ top: 18, right: 12, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="sorting-line-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#78a948" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#78a948" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#dfe9d9" strokeDasharray="4 4" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7c8c78", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7c8c78", fontSize: 11 }} width={54} />
                <Tooltip
                  formatter={(value) => [`${formatWeight(Number(value))} kg`, "選果量"]}
                  contentStyle={{ borderRadius: 14, borderColor: "#dfe9d9", boxShadow: "0 10px 30px rgba(55,75,35,.1)" }}
                />
                <Area type="monotone" dataKey="weightKg" stroke="#6f9f43" strokeWidth={3} fill="url(#sorting-line-fill)" activeDot={{ r: 5, fill: "#557f3e", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <article className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)] sm:p-6">
        <h2 className="text-lg font-bold text-kiwi-ink">サイズ別内訳</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          同じ品種・期間のサイズ構成
        </p>
        {analytics.sizeTotals.length === 0 ? (
          <div className="grid min-h-52 place-items-center text-sm text-muted-foreground">
            データがありません。
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {analytics.sizeTotals.map((item) => (
              <div key={item.sizeCode}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-kiwi-ink">{item.sizeCode}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatWeight(item.weightKg)} kg
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-kiwi-pale/35">
                  <div
                    className="h-full rounded-full bg-[#78a948]"
                    style={{
                      width: `${
                        maxSizeWeight > 0
                          ? Math.max(3, (item.weightKg / maxSizeWeight) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

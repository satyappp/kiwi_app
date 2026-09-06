"use client";

import { useMemo, useState } from "react";

import { HarvestMonthlyLineChart } from "@/features/harvest/components/harvest-charts";
import type { HarvestAnalyticsEntry, HarvestChartPoint } from "@/features/harvest/schema";

const ALL_VARIETIES = "all";
type ChartGranularity = "month" | "year";

export function HarvestDataAnalytics({ entries }: { entries: HarvestAnalyticsEntry[] }) {
  const [selectedVariety, setSelectedVariety] = useState(ALL_VARIETIES);
  const [granularity, setGranularity] = useState<ChartGranularity>("month");
  const varieties = useMemo(
    () => [...new Set(entries.map((entry) => entry.varietyName))].sort((a, b) => a.localeCompare(b, "ja")),
    [entries],
  );
  const filteredEntries = useMemo(
    () => entries.filter((entry) => selectedVariety === ALL_VARIETIES || entry.varietyName === selectedVariety),
    [entries, selectedVariety],
  );

  const analytics = useMemo(() => {
    if (filteredEntries.length === 0) {
      return { monthly: [] as HarvestChartPoint[], periodEntries: [] as HarvestAnalyticsEntry[] };
    }

    const latestMonth = filteredEntries
      .map((entry) => entry.month)
      .sort((a, b) => b.localeCompare(a))[0];
    const [latestYear, latestMonthNumber] = latestMonth.split("-").map(Number);
    const periodTotals = new Map<string, number>();

    if (granularity === "month") {
      for (let offset = 11; offset >= 0; offset -= 1) {
        const date = new Date(Date.UTC(latestYear, latestMonthNumber - 1 - offset, 1));
        const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
        periodTotals.set(key, 0);
      }
    } else {
      for (let offset = 4; offset >= 0; offset -= 1) {
        periodTotals.set(String(latestYear - offset), 0);
      }
    }

    const keyFor = (entry: HarvestAnalyticsEntry) => entry.month.slice(0, granularity === "month" ? 7 : 4);
    const periodEntries = filteredEntries.filter((entry) => periodTotals.has(keyFor(entry)));
    for (const entry of periodEntries) {
      const key = keyFor(entry);
      periodTotals.set(key, (periodTotals.get(key) ?? 0) + entry.weightKg);
    }

    return {
      periodEntries,
      monthly: [...periodTotals.entries()].map(([period, weightKg]): HarvestChartPoint => ({
        label: granularity === "month"
          ? `${Number(period.slice(0, 4))}/${Number(period.slice(5, 7))}`
          : `${period}年`,
        weightKg,
      })),
    };
  }, [filteredEntries, granularity]);

  const totalWeightKg = analytics.periodEntries.reduce((sum, entry) => sum + entry.weightKg, 0);
  const recordCount = analytics.periodEntries.reduce((sum, entry) => sum + entry.recordCount, 0);
  const averageWeightKg = analytics.monthly.length > 0 ? totalWeightKg / analytics.monthly.length : 0;

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-kiwi-ink">{granularity === "month" ? "月別" : "年別"}収穫量の推移</h2>
          <p className="mt-1 text-xs text-muted-foreground">品種と表示単位を選んで収穫量の変化を確認できます</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex self-start rounded-xl bg-kiwi-pale/30 p-1">
            {(["month", "year"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={granularity === value}
                onClick={() => setGranularity(value)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${granularity === value ? "bg-white text-kiwi-ink shadow-sm" : "text-muted-foreground hover:text-kiwi-ink"}`}
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
              className="h-10 min-w-44 rounded-xl border border-border bg-white px-3 text-sm font-bold text-kiwi-ink outline-none focus:border-kiwi focus:ring-2 focus:ring-kiwi/15"
            >
              <option value={ALL_VARIETIES}>すべての品種</option>
              {varieties.map((variety) => (
                <option key={variety} value={variety}>{variety}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-kiwi-pale/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">期間合計</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-kiwi-ink">
            {totalWeightKg.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} <span className="text-xs">kg</span>
          </p>
        </div>
        <div className="rounded-xl bg-kiwi-pale/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">{granularity === "month" ? "12か月平均" : "5年平均"}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-kiwi-ink">
            {averageWeightKg.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} <span className="text-xs">kg</span>
          </p>
        </div>
        <div className="rounded-xl bg-kiwi-pale/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">収穫記録</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-kiwi-ink">
            {recordCount.toLocaleString("ja-JP")} <span className="text-xs">件</span>
          </p>
        </div>
      </div>

      <div className="mt-2">
        <HarvestMonthlyLineChart data={analytics.monthly} />
      </div>
    </section>
  );
}

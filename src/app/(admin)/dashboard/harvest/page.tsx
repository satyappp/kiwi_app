import Link from "next/link";
import { ArrowLeft, Download, Plus } from "lucide-react";

import {
  HarvestDataAnalytics,
  HarvestTable,
  listHarvestLogs,
} from "@/features/harvest";
import type { HarvestAnalyticsEntry } from "@/features/harvest/schema";

export default async function DashboardHarvestPage() {
  const rows = await listHarvestLogs(1000);
  const totalWeight = rows.reduce((sum, row) => sum + row.weightKg, 0);
  const analyticsByMonthAndVariety = new Map<string, HarvestAnalyticsEntry>();

  for (const row of rows) {
    const month = row.workDate.slice(0, 7);
    const key = `${month}\u0000${row.varietyName}`;
    const current = analyticsByMonthAndVariety.get(key);
    analyticsByMonthAndVariety.set(key, {
      month,
      varietyName: row.varietyName,
      weightKg: (current?.weightKg ?? 0) + row.weightKg,
      recordCount: (current?.recordCount ?? 0) + 1,
    });
  }
  const analyticsEntries = [...analyticsByMonthAndVariety.values()];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-kiwi-ink">
            <ArrowLeft className="size-4" /> ダッシュボード
          </Link>
          <h1 className="text-2xl font-bold text-kiwi-ink sm:text-3xl">収穫データ</h1>
          <p className="mt-2 text-sm text-muted-foreground">登録済みの収穫を新しい順に表示しています。</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-muted-foreground opacity-60">
            <Download className="size-4" /> CSV出力
          </button>
          <Link href="/harvest/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557f3e] px-4 text-sm font-bold text-white hover:bg-[#466d33]">
            <Plus className="size-4" /> 収穫を記録
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl bg-white/88 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">表示中の記録</p>
          <p className="mt-2 text-2xl font-bold text-kiwi-ink">{rows.length.toLocaleString("ja-JP")} 件</p>
        </article>
        <article className="rounded-2xl bg-white/88 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">合計収穫量</p>
          <p className="mt-2 text-2xl font-bold text-kiwi-ink">
            {totalWeight.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} <span className="text-sm">kg</span>
          </p>
        </article>
        <article className="rounded-2xl bg-white/88 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">期限の確認が必要</p>
          <p className="mt-2 text-2xl font-bold text-kiwi-ink">
            {rows.filter((row) => row.status === "overdue" || row.status === "due-soon").length.toLocaleString("ja-JP")} 件
          </p>
        </article>
      </section>

      <HarvestDataAnalytics entries={analyticsEntries} />

      <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)]">
        <div className="border-b px-5 py-4">
          <h2 className="font-bold text-kiwi-ink">収穫記録一覧</h2>
          <p className="mt-1 text-xs text-muted-foreground">列名を押すと並び替えできます・最大1,000件</p>
        </div>
        <HarvestTable rows={rows} sortable pageSize={25} showActions />
      </section>
    </div>
  );
}

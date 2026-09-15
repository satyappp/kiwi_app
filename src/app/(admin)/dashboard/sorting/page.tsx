import { ArrowLeft, Download, Plus } from "lucide-react";
import Link from "next/link";

import {
  listSortingLogs,
  SortingDataAnalytics,
  SortingTable,
  type SortingAnalyticsEntry,
} from "@/features/sorting";

export default async function DashboardSortingPage() {
  const rows = await listSortingLogs(1000);
  const analyticsByPeriod = new Map<string, SortingAnalyticsEntry>();

  for (const row of rows) {
    const month = row.sortingDate.slice(0, 7);
    const key = `${month}\u0000${row.varietyName}\u0000${row.sizeCode}`;
    const current = analyticsByPeriod.get(key);
    analyticsByPeriod.set(key, {
      month,
      varietyName: row.varietyName,
      sizeCode: row.sizeCode,
      weightKg: (current?.weightKg ?? 0) + row.weightKg,
      recordCount: (current?.recordCount ?? 0) + 1,
    });
  }

  const totalWeight = rows.reduce((sum, row) => sum + row.weightKg, 0);
  const availableWeight = rows.reduce(
    (sum, row) => sum + row.availableWeightKg,
    0,
  );
  const attentionCount = rows.filter(
    (row) => row.status === "overdue" || row.status === "due-soon",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-kiwi-ink">
            <ArrowLeft className="size-4" /> ダッシュボード
          </Link>
          <h1 className="text-2xl font-bold text-kiwi-ink sm:text-3xl">選果データ</h1>
          <p className="mt-2 text-sm text-muted-foreground">選果量、サイズ構成、追熟への使用状況を確認できます。</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-muted-foreground opacity-60">
            <Download className="size-4" /> CSV出力
          </button>
          <Link href="/sorting/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557f3e] px-4 text-sm font-bold text-white hover:bg-[#466d33]">
            <Plus className="size-4" /> 選果を登録
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["表示中の記録", `${rows.length.toLocaleString("ja-JP")} 件`],
          ["合計選果量", `${totalWeight.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} kg`],
          ["追熟に使用可能", `${availableWeight.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} kg`],
          ["期限の確認が必要", `${attentionCount.toLocaleString("ja-JP")} 件`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl bg-white/88 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold text-kiwi-ink">{value}</p>
          </article>
        ))}
      </section>

      <SortingDataAnalytics entries={[...analyticsByPeriod.values()]} />

      <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)]">
        <div className="border-b px-5 py-4">
          <h2 className="font-bold text-kiwi-ink">選果記録一覧</h2>
          <p className="mt-1 text-xs text-muted-foreground">全項目を確認できます・列名で並び替え・最大1,000件</p>
        </div>
        <SortingTable rows={rows} />
      </section>
    </div>
  );
}

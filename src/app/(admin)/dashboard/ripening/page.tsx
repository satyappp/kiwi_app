import { ChartNoAxesGantt, Plus } from "lucide-react";
import Link from "next/link";

import { listRipeningHistory, RipeningHistoryTable } from "@/features/ripening";

export default async function DashboardRipeningPage() {
  const rows = await listRipeningHistory();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-kiwi">RIPENING</p>
          <h1 className="mt-1 text-2xl font-bold text-kiwi-ink sm:text-3xl">追熟管理</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            過去の追熟記録を確認し、コンテナラベルを再印刷できます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/ripening/timeline-preview"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-kiwi-ink hover:bg-muted"
          >
            <ChartNoAxesGantt className="size-4" />
            タイムライン表示
          </Link>
          <Link
            href="/ripening/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#557f3e] px-4 text-sm font-bold text-white hover:bg-[#466d33]"
          >
            <Plus className="size-4" />
            追熟を開始
          </Link>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)]">
        <div className="border-b px-5 py-4">
          <h2 className="font-bold text-kiwi-ink">追熟記録一覧</h2>
          <p className="mt-1 text-xs text-muted-foreground">新しい記録から最大500件</p>
        </div>
        <RipeningHistoryTable rows={rows} />
      </section>
    </div>
  );
}

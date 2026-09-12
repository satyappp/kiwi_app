import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarDays, PackageCheck, Scale, Sprout, Timer, Truck } from "lucide-react";

import { HarvestTable } from "@/features/harvest/components/harvest-table";
import { HarvestWeightChart } from "@/features/harvest/components/harvest-charts";
import { DashboardQuickActions } from "@/features/harvest/components/dashboard-quick-actions";
import type { HarvestDashboardData, HarvestPeriod } from "@/features/harvest/schema";
import type { InventoryOverview, InventoryStatus } from "@/features/inventory";
import { cn } from "@/lib/utils";

const periods: Array<{ value: HarvestPeriod; label: string }> = [
  { value: "today", label: "今日" },
  { value: "week", label: "今週" },
  { value: "month", label: "今月" },
];

function periodHref(period: HarvestPeriod) {
  return period === "month" ? "/dashboard" : `/dashboard?period=${period}`;
}

function inventoryWeight(inventory: InventoryOverview, status: InventoryStatus) {
  return inventory.rows
    .filter((row) => row.status === status)
    .reduce((total, row) => total + row.weightKg, 0);
}

export function HarvestDashboard({
  data,
  inventory,
  staffName,
}: {
  data: HarvestDashboardData;
  inventory: InventoryOverview;
  staffName: string;
}) {
  const today = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  const formatWeight = (value: number) =>
    value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  const coldWeightKg = inventoryWeight(inventory, "cold");
  const ripeningWeightKg = inventoryWeight(inventory, "ripening");
  const readyWeightKg = inventoryWeight(inventory, "ready");
  const reservedWeightKg = inventoryWeight(inventory, "reserved");
  const nextColdItem = inventory.rows
    .filter((row) => row.status === "cold" && row.deadlineAt)
    .sort((left, right) =>
      (left.deadlineAt ?? "").localeCompare(right.deadlineAt ?? ""),
    )[0];
  const nextAction = data.nextAction
    ? {
        message: `${data.nextAction.varietyName}（${data.nextAction.plotName}）の選果期限は ${data.nextAction.sortingDeadline} です。`,
        href: "/sorting/new?returnTo=/dashboard",
        label: "選果を入力",
      }
    : nextColdItem
      ? {
          message: `${nextColdItem.varietyName}の追熟開始期限を確認してください。`,
          href: "/ripening/new",
          label: "追熟を開始",
        }
      : readyWeightKg > 0
        ? {
            message: `${formatWeight(readyWeightKg)} kgの出荷可能在庫があります。`,
            href: "/shipping/new",
            label: "出荷を入力",
          }
        : null;

  const summaryCards = [
    { label: `${data.periodLabel}の収穫量`, value: formatWeight(data.totalWeightKg), unit: "kg", detail: `${data.recordCount}件の収穫記録`, icon: Sprout, tone: "bg-amber-100 text-amber-700", href: "/dashboard/harvest" },
    { label: "未選果量", value: formatWeight(data.unsortedWeightKg), unit: "kg", detail: data.attentionCount > 0 ? `期限確認 ${data.attentionCount}件` : "期限内です", icon: Scale, tone: "bg-kiwi-pale/60 text-kiwi-ink", href: "/sorting/new" },
    { label: "追熟中", value: formatWeight(ripeningWeightKg), unit: "kg", detail: `${inventory.rows.filter((row) => row.status === "ripening").length}件`, icon: Timer, tone: "bg-violet-50 text-violet-700", href: "/dashboard/ripening" },
    { label: "出荷可能", value: formatWeight(readyWeightKg), unit: "kg", detail: reservedWeightKg > 0 ? `予約済み ${formatWeight(reservedWeightKg)} kg` : "現在の在庫", icon: Truck, tone: "bg-sky-50 text-sky-700", href: "/dashboard/inventory" },
  ];
  const processStages = [
    { label: "未選果", value: data.unsortedWeightKg, color: "bg-amber-400", href: "/sorting/new" },
    { label: "冷蔵中", value: coldWeightKg, color: "bg-cyan-300", href: "/dashboard/inventory" },
    { label: "追熟中", value: ripeningWeightKg, color: "bg-violet-300", href: "/dashboard/ripening" },
    { label: "出荷可能在庫", value: readyWeightKg, color: "bg-sky-300", href: "/dashboard/inventory" },
    { label: "予約済み", value: reservedWeightKg, color: "bg-emerald-300", href: "/dashboard/inventory" },
  ];
  const maximumStageWeight = Math.max(
    1,
    ...processStages.map((stage) => stage.value),
  );

  return (
    <div className="space-y-7 lg:space-y-9">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-kiwi-ink sm:text-3xl lg:text-4xl">
            おはようございます、{staffName}さん
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">今日も農園の一日を始めましょう。</p>
        </div>
        <DashboardQuickActions />
      </section>

      <section className="rounded-2xl border border-amber-200/80 bg-[#fffbed]/90 p-4 shadow-[0_10px_28px_-20px_rgba(130,101,20,.35)] sm:flex sm:items-center sm:gap-4 sm:p-5">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <AlertCircle className="size-5" />
        </div>
        <div className="mt-3 min-w-0 flex-1 sm:mt-0">
          <p className="font-bold text-amber-900">次のアクション</p>
          <p className="mt-1 text-sm text-amber-900/65">
            {nextAction?.message ?? "現在、確認が必要な作業はありません。"}
          </p>
        </div>
        {nextAction && (
          <Link
            href={nextAction.href}
            className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amber-800 sm:mt-0"
          >
            {nextAction.label} <ArrowRight className="size-4" />
          </Link>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-kiwi-ink">農園の概況</h2>
            <p className="mt-1 text-sm text-muted-foreground">各工程の重要な状況をまとめて確認できます</p>
          </div>
          <div className="inline-flex self-start rounded-xl bg-kiwi-pale/30 p-1">
            {periods.map((period) => (
              <Link key={period.value} href={periodHref(period.value)} className={cn("rounded-lg px-4 py-2 text-sm font-bold transition", data.period === period.value ? "bg-white text-kiwi-ink shadow-sm" : "text-muted-foreground hover:text-kiwi-ink")}>
                {period.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Link key={card.label} href={card.href} className="rounded-2xl border border-white/80 bg-white/88 p-5 shadow-[0_14px_34px_-22px_rgba(55,75,35,.3)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <span className={cn("grid size-10 place-items-center rounded-xl", card.tone)}><card.icon className="size-5" /></span>
              </div>
              <p className="mt-6 text-3xl font-bold tabular-nums text-kiwi-ink">
                {card.value}<span className="ml-1.5 text-sm font-medium text-muted-foreground">{card.unit}</span>
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{card.detail}</span>
                <ArrowRight className="size-4 text-kiwi" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-white/80 bg-white/88 p-5 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)] sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-kiwi-ink">収穫量の推移</h2><p className="mt-1 text-xs text-muted-foreground">kg / 日</p></div>
            <CalendarDays className="size-5 text-kiwi" />
          </div>
          <HarvestWeightChart data={data.dailyWeights} />
        </article>
        <article className="rounded-2xl border border-white/80 bg-white/88 p-5 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)] sm:p-6">
          <div className="flex items-start justify-between">
            <div><h2 className="text-lg font-bold text-kiwi-ink">工程別の状況</h2><p className="mt-1 text-xs text-muted-foreground">収穫から出荷まで</p></div>
            <PackageCheck className="size-5 text-kiwi" />
          </div>
          <div className="mt-6 space-y-5">
            {processStages.map((stage) => (
              <Link key={stage.label} href={stage.href} className="block rounded-lg p-1 transition hover:bg-kiwi-pale/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">{stage.label}</span>
                  <strong className="tabular-nums text-kiwi-ink">{formatWeight(stage.value)} kg</strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-kiwi-pale/25">
                  <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${Math.min(100, (stage.value / maximumStageWeight) * 100)}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/88 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)]">
        <div className="flex items-center justify-between px-5 py-5 sm:px-6">
          <div><h2 className="text-lg font-bold text-kiwi-ink">最近の収穫記録</h2><p className="mt-1 text-xs text-muted-foreground">最新6件</p></div>
          <Link href="/dashboard/harvest" className="inline-flex items-center gap-1 text-sm font-bold text-kiwi">詳細を見る <ArrowRight className="size-4" /></Link>
        </div>
        <HarvestTable rows={data.recentHarvests} />
      </section>
    </div>
  );
}

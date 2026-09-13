import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SortingLabel } from "@/features/sorting/components/sorting-label";
import { getSortingLabel } from "@/features/sorting/queries";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatWeight(value: number) {
  return `${value.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} kg`;
}

export default async function DashboardSortingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSortingLabel(id);
  if (!data) notFound();

  const details = [
    ["入力日時", formatDateTime(data.inputTs)],
    ["選果日", formatDate(data.sortingDate)],
    ["担当者", data.staffName],
    ["品種", data.varietyName],
    ["園地", data.plotName],
    ["等級", `${data.sizeCode}（${data.sizeName}）`],
    ["選果量", formatWeight(data.weightKg)],
    ["追熟使用済", formatWeight(data.allocatedWeightKg)],
    ["追熟に使用可能", formatWeight(data.availableWeightKg)],
    ["収穫の選果期限", formatDate(data.sortingDeadline)],
    ["エチレン開始期限", formatDate(data.ethyleneStartDeadline)],
    ["元の収穫", data.harvestTitle],
  ];

  return (
    <div className="space-y-6">
      <header>
        <Link href="/dashboard/sorting" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-kiwi-ink">
          <ArrowLeft className="size-4" /> 選果データ
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-kiwi-ink sm:text-3xl">{data.varietyName}・{data.sizeCode}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{formatDate(data.sortingDate)}・{data.plotName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/sorting/${id}/label`} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-kiwi-ink hover:bg-muted">
              <Download className="size-4" /> PDF保存
            </a>
            <Link href={`/sorting/${id}/label`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557f3e] px-4 text-sm font-bold text-white hover:bg-[#466d33]">
              <Printer className="size-4" /> 印刷
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {details.map(([label, value]) => (
          <article key={label} className={`rounded-2xl bg-white/88 p-5 shadow-sm ${label === "元の収穫" ? "sm:col-span-2 xl:col-span-4" : ""}`}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 break-words font-bold text-kiwi-ink">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl bg-white/75 p-4 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="font-bold text-kiwi-ink">印刷プレビュー</h2>
          <p className="mt-1 text-xs text-muted-foreground">画面では縮小表示・印刷/PDFはA5横</p>
        </div>
        <div className="max-w-full overflow-auto">
          <SortingLabel data={data} />
        </div>
      </section>
    </div>
  );
}

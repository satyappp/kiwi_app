import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { HarvestLabel } from "@/features/harvest/components/harvest-label";
import { getHarvestLabel } from "@/features/harvest/queries";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

export default async function DashboardHarvestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getHarvestLabel(id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <header>
        <Link href="/dashboard/harvest" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-kiwi-ink">
          <ArrowLeft className="size-4" /> 収穫データ
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-kiwi-ink sm:text-3xl">{data.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatDate(data.workDate)}・{data.staffName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/harvest/${id}/label`} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-kiwi-ink hover:bg-muted">
              <Download className="size-4" /> PDF保存
            </a>
            <Link href={`/harvest/${id}/label`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557f3e] px-4 text-sm font-bold text-white hover:bg-[#466d33]">
              <Printer className="size-4" /> 印刷
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["品種", data.varietyName],
          ["園地", data.plotName],
          ["樹体・枝", [data.treeBlockName, data.branch].filter(Boolean).join("・") || "-"],
          ["量", `${data.weightKg.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} kg`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl bg-white/88 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-bold text-kiwi-ink">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl bg-white/75 p-4 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="font-bold text-kiwi-ink">印刷プレビュー</h2>
          <p className="mt-1 text-xs text-muted-foreground">画面では縮小表示・印刷/PDFはA4横</p>
        </div>
        <div className="max-w-full overflow-auto">
          <HarvestLabel data={data} />
        </div>
      </section>
    </div>
  );
}

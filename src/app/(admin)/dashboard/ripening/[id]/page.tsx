import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RipeningLabel } from "@/features/ripening/components/ripening-label";
import { getRipeningLabel } from "@/features/ripening/queries";

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

export default async function DashboardRipeningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRipeningLabel(id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <header>
        <Link href="/dashboard/ripening" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-kiwi-ink">
          <ArrowLeft className="size-4" /> 追熟管理
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-kiwi-ink sm:text-3xl">{data.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatDateTime(data.startedAt)}・{data.locationName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/ripening/${id}/label`} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-kiwi-ink hover:bg-muted">
              <Download className="size-4" /> PDF保存
            </a>
            <Link href={`/ripening/${id}/label?print=1`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557f3e] px-4 text-sm font-bold text-white hover:bg-[#466d33]">
              <Printer className="size-4" /> ラベルを印刷
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["品種", data.varietyName],
          ["園地", data.plotNames.join("・") || "-"],
          ["等級", data.sizeCodes.join("・") || "-"],
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
          <p className="mt-1 text-xs text-muted-foreground">A4横・実寸レイアウト</p>
        </div>
        <div className="max-w-full overflow-auto">
          <RipeningLabel data={data} />
        </div>
      </section>
    </div>
  );
}

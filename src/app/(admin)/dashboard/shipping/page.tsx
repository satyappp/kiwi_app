import { ArrowLeft, Download, Plus } from "lucide-react";
import Link from "next/link";
import { listShippingSales, ShippingDataAnalytics, ShippingSalesTable } from "@/features/shipping";

export default async function DashboardShippingPage() {
  const rows = await listShippingSales(1000);
  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/dashboard" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-kiwi-ink"><ArrowLeft className="size-4" /> ダッシュボード</Link><h1 className="text-2xl font-bold text-kiwi-ink sm:text-3xl">出荷管理</h1></div><div className="flex gap-2"><button type="button" disabled className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-muted-foreground opacity-60"><Download className="size-4" /> CSV出力</button><Link href="/shipping/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557f3e] px-4 text-sm font-bold text-white hover:bg-[#466d33]"><Plus className="size-4" /> 出荷を登録</Link></div></div>
    <ShippingDataAnalytics rows={rows} />
    <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)]"><div className="border-b px-5 py-4"><h2 className="font-bold text-kiwi-ink">出荷・販売記録一覧</h2></div><ShippingSalesTable rows={rows} /></section>
  </div>;
}

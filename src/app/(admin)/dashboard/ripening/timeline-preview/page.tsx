import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  RipeningTimeline,
  type RipeningTimelineItem,
} from "@/features/ripening";

const HOUR_MS = 60 * 60 * 1000;
const PREVIEW_NOW = new Date("2026-09-14T03:00:00.000Z").getTime();

function sampleAt(now: number, hoursFromNow: number) {
  return new Date(now + hoursFromNow * HOUR_MS).toISOString();
}

export default function RipeningTimelinePreviewPage() {
  const items: RipeningTimelineItem[] = [
    {
      id: "preview-104",
      ripeningNo: 104,
      varietyName: "紅妃",
      locationName: "追熟庫A",
      weightKg: 45,
      startedAt: sampleAt(PREVIEW_NOW, -32),
      ethyleneEndedAt: sampleAt(PREVIEW_NOW, -8),
      shippableAt: sampleAt(PREVIEW_NOW, 22),
    },
    {
      id: "preview-105",
      ripeningNo: 105,
      varietyName: "香緑",
      locationName: "追熟庫B",
      weightKg: 80,
      startedAt: sampleAt(PREVIEW_NOW, -18),
      ethyleneEndedAt: sampleAt(PREVIEW_NOW, 6),
      shippableAt: sampleAt(PREVIEW_NOW, 62),
    },
    {
      id: "preview-106",
      ripeningNo: 106,
      varietyName: "さぬきキウイっこ1号",
      locationName: "追熟庫A",
      weightKg: 62,
      startedAt: sampleAt(PREVIEW_NOW, -4),
      ethyleneEndedAt: sampleAt(PREVIEW_NOW, 18),
      shippableAt: sampleAt(PREVIEW_NOW, 42),
    },
    {
      id: "preview-107",
      ripeningNo: 107,
      varietyName: "ヘイワード",
      locationName: "追熟庫C",
      weightKg: 110,
      startedAt: sampleAt(PREVIEW_NOW, 12),
      ethyleneEndedAt: sampleAt(PREVIEW_NOW, 36),
      shippableAt: sampleAt(PREVIEW_NOW, 96),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/dashboard/ripening"
          className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-kiwi-ink"
        >
          <ArrowLeft className="size-4" />
          追熟管理
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-kiwi">DESIGN PREVIEW</p>
            <h1 className="mt-1 text-2xl font-bold text-kiwi-ink sm:text-3xl">
              追熟タイムライン表示例
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              異なる品種と処理時間が同時進行する場合のダッシュボード表示です。
            </p>
          </div>
          <span className="self-start rounded-full bg-kiwi-amber/25 px-3 py-1.5 text-xs font-bold text-kiwi-brown">
            デザイン確認用・仮データ
          </span>
        </div>
      </header>

      <RipeningTimeline
        items={items}
        currentTime={new Date(PREVIEW_NOW).toISOString()}
      />

      <section className="rounded-2xl border border-dashed border-kiwi/25 bg-white/70 p-5 text-sm text-muted-foreground">
        <p className="font-bold text-kiwi-ink">確認していただきたいポイント</p>
        <p className="mt-2 leading-6">
          品種名とロット情報の見せ方、ロットごとの色分け、エチレン処理と保管期間の区切り、現在時刻と出荷可能時刻の把握しやすさをご確認ください。
        </p>
      </section>
    </div>
  );
}

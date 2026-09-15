import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock3,
  Download,
  Flame,
  MapPin,
  PackageCheck,
  Printer,
  Thermometer,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  completeRipening,
  confirmEthyleneRemoval,
} from "@/features/ripening/actions";
import { RipeningLabel } from "@/features/ripening/components/ripening-label";
import { RipeningTimeline } from "@/features/ripening/components/ripening-timeline";
import type {
  RipeningDetailData,
  RipeningPhase,
} from "@/features/ripening/schema";

const phaseLabels: Record<RipeningPhase, string> = {
  scheduled: "開始前",
  ethylene_processing: "エチレン処理中",
  post_ethylene_processing: "エチレン後の保管中",
  ready_to_ship: "出荷可能",
  completed: "完了",
  cancelled: "取消",
};

const phaseClasses: Record<RipeningPhase, string> = {
  scheduled: "bg-muted text-muted-foreground",
  ethylene_processing: "bg-kiwi-amber/30 text-kiwi-brown",
  post_ethylene_processing: "bg-violet-100 text-violet-700",
  ready_to_ship: "bg-sky-100 text-sky-700",
  completed: "bg-primary/12 text-kiwi-ink",
  cancelled: "bg-destructive/10 text-destructive",
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-bold text-kiwi-ink">{value}</dd>
    </div>
  );
}

function NextAction({ data }: { data: RipeningDetailData }) {
  if (!data.nextCheckAt) return null;
  const isEthyleneEnd = data.nextCheckType === "ethylene_end";

  return (
    <section
      className={`rounded-2xl border p-5 ${
        data.isOverdue
          ? "border-destructive/30 bg-destructive/8"
          : "border-kiwi-amber/60 bg-[#fffbed]/90"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-kiwi-amber/30 text-kiwi-brown">
            <BellRing className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-kiwi-ink">
              {isEthyleneEnd ? "エチレン終了を確認" : "出荷可能時刻を確認"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(data.nextCheckAt)}
              {data.isOverdue ? "・確認期限を過ぎています" : data.isDueSoon ? "・まもなく確認時刻です" : ""}
            </p>
          </div>
        </div>

        {data.isOverdue && isEthyleneEnd && (
          <form action={confirmEthyleneRemoval}>
            <input type="hidden" name="batchId" value={data.id} />
            <Button type="submit" className="h-10 rounded-xl font-bold">
              エチレン終了を記録
            </Button>
          </form>
        )}
        {data.phase === "ready_to_ship" && (
          <form action={completeRipening}>
            <input type="hidden" name="batchId" value={data.id} />
            <Button type="submit" className="h-10 rounded-xl font-bold">
              追熟完了を記録
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

export function RipeningDetail({ data }: { data: RipeningDetailData }) {
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-kiwi-ink sm:text-3xl">
                {data.title}
              </h1>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${phaseClasses[data.phase]}`}>
                {phaseLabels[data.phase]}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              No. {data.ripeningNo}・{formatDateTime(data.startedAt)}・{data.locationName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/ripening/${data.id}/label`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold text-kiwi-ink hover:bg-muted"
            >
              <Download className="size-4" />
              PDF保存
            </a>
            <Link
              href={`/ripening/${data.id}/label`}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#557f3e] px-4 text-sm font-bold text-white hover:bg-[#466d33]"
            >
              <Printer className="size-4" />
              印刷
            </Link>
          </div>
        </div>
      </header>

      <NextAction data={data} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["品種", data.varietyName],
          ["園地", data.plotNames.join("・") || "-"],
          ["等級", data.sizeCodes.join("・") || "-"],
          ["合計量", `${formatNumber(data.weightKg)} kg`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl bg-white/88 p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-bold text-kiwi-ink">{value}</p>
          </article>
        ))}
      </section>

      <RipeningTimeline
        currentTime={new Date().toISOString()}
        items={[
          {
            id: data.id,
            ripeningNo: data.ripeningNo,
            varietyName: data.varietyName,
            locationName: data.locationName,
            weightKg: data.weightKg,
            startedAt: data.startedAt,
            ethyleneEndedAt: data.ethyleneEndedAt,
            shippableAt: data.shippableAt,
          },
        ]}
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="size-5 text-kiwi-brown" />
            <h2 className="font-bold text-kiwi-ink">処理条件</h2>
          </div>
          <dl>
            <DetailRow label="エチレン温度" value={data.ethyleneTemperatureC == null ? "未設定" : `${formatNumber(data.ethyleneTemperatureC)} ℃`} />
            <DetailRow label="エチレン処理時間" value={`${formatNumber(data.ethyleneProcessingHours)} 時間`} />
            <DetailRow label="エチレン終了" value={formatDateTime(data.ethyleneEndedAt)} />
            <DetailRow label="終了確認" value={formatDateTime(data.ethyleneRemovedAt)} />
          </dl>
        </article>

        <article className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Thermometer className="size-5 text-violet-600" />
            <h2 className="font-bold text-kiwi-ink">エチレン後の保管</h2>
          </div>
          <dl>
            <DetailRow label="保管温度" value={data.restingTemperatureC == null ? "未設定" : `${formatNumber(data.restingTemperatureC)} ℃`} />
            <DetailRow label="保管時間" value={`${formatNumber(data.restingDurationHours)} 時間`} />
            <DetailRow label="保管開始" value={formatDateTime(data.restingStartedAt)} />
            <DetailRow label="出荷可能" value={formatDateTime(data.shippableAt)} />
          </dl>
        </article>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PackageCheck className="size-5 text-kiwi" />
            <h2 className="font-bold text-kiwi-ink">選果データの内訳</h2>
          </div>
          <span className="text-sm font-bold text-kiwi">合計 {formatNumber(data.weightKg)} kg</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-3 font-medium">収穫</th>
                <th className="pb-3 font-medium">園地</th>
                <th className="pb-3 font-medium">サイズ</th>
                <th className="pb-3 text-right font-medium">量</th>
              </tr>
            </thead>
            <tbody>
              {data.breakdown.map((item) => (
                <tr key={item.sortingLogId} className="border-b last:border-0">
                  <td className="py-3 font-medium text-kiwi-ink">{item.harvestTitle || item.sortingTitle}</td>
                  <td className="py-3 text-muted-foreground">{item.plotName || "-"}</td>
                  <td className="py-3 text-muted-foreground">{item.sizeCode || "-"}</td>
                  <td className="py-3 text-right font-bold tabular-nums text-kiwi-ink">{formatNumber(item.weightKg)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="size-5 text-kiwi" />
            <h2 className="font-bold text-kiwi-ink">記録情報</h2>
          </div>
          <dl>
            <DetailRow label="担当者" value={data.staffName} />
            <DetailRow label="追熟場所" value={data.locationName} />
            <DetailRow label="通知" value={data.notificationsEnabled ? "有効" : "無効"} />
            <DetailRow label="完了日時" value={formatDateTime(data.completedAt)} />
          </dl>
        </article>
        <article className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Clock3 className="size-5 text-kiwi" />
            <h2 className="font-bold text-kiwi-ink">メモ</h2>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {data.notes || "メモはありません。"}
          </p>
        </article>
      </section>

      <details className="group rounded-2xl border border-white/80 bg-white/75 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 font-bold text-kiwi-ink">
          <CheckCircle2 className="size-5 text-kiwi" />
          ラベル印刷プレビュー
          <span className="ml-auto text-xs font-medium text-muted-foreground group-open:hidden">開く</span>
        </summary>
        <div className="border-t p-4 sm:p-6">
          <div className="max-w-full overflow-auto">
            <RipeningLabel data={data} />
          </div>
        </div>
      </details>
    </div>
  );
}

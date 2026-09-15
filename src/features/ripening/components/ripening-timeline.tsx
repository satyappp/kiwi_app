import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { RipeningPhase } from "@/features/ripening/schema";
import { cn } from "@/lib/utils";

export type RipeningTimelineItem = {
  id: string;
  ripeningNo: number;
  varietyName: string;
  locationName: string;
  weightKg: number;
  startedAt: string;
  ethyleneEndedAt: string;
  shippableAt: string;
  phase?: RipeningPhase;
  href?: string;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const palettes = [
  { solid: "bg-rose-400", soft: "bg-rose-200", ring: "border-rose-500" },
  { solid: "bg-violet-400", soft: "bg-violet-200", ring: "border-violet-500" },
  { solid: "bg-sky-400", soft: "bg-sky-200", ring: "border-sky-500" },
  { solid: "bg-amber-400", soft: "bg-amber-200", ring: "border-amber-500" },
  { solid: "bg-emerald-400", soft: "bg-emerald-200", ring: "border-emerald-500" },
  { solid: "bg-fuchsia-400", soft: "bg-fuchsia-200", ring: "border-fuchsia-500" },
] as const;

function parseTime(value: string) {
  return new Date(value).getTime();
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTick(value: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function statusFor(item: RipeningTimelineItem, now: number) {
  if (item.phase === "completed") return "完了";
  if (item.phase === "cancelled") return "取消";
  if (now < parseTime(item.startedAt)) return "開始前";
  if (now < parseTime(item.ethyleneEndedAt)) return "エチレン処理中";
  if (now < parseTime(item.shippableAt)) return "保管中";
  return "出荷可能";
}

export function RipeningTimeline({
  items,
  currentTime,
  viewAllHref,
}: {
  items: RipeningTimelineItem[];
  currentTime: string;
  viewAllHref?: string;
}) {
  // バー自体に工程名があるため、凡例は記号だけでは分かりにくい「出荷可能」に絞る。
  const header = (
    <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="font-bold text-kiwi-ink">追熟タイムライン</h2>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-kiwi bg-white" />出荷可能
        </span>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 font-bold text-kiwi-ink transition hover:bg-muted"
          >
            すべて見る
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <section className="isolate overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)]">
        {header}
        <div className="px-6 py-14 text-center text-sm text-muted-foreground">
          表示できる追熟ロットがありません。
        </div>
      </section>
    );
  }

  const now = parseTime(currentTime);
  const eventTimes = items.flatMap((item) => [
    parseTime(item.startedAt),
    parseTime(item.ethyleneEndedAt),
    parseTime(item.shippableAt),
  ]);
  const firstEvent = Math.min(...eventTimes, now);
  const lastEvent = Math.max(...eventTimes, now);
  const padding = Math.max((lastEvent - firstEvent) * 0.04, 4 * HOUR_MS);
  const rangeStart = firstEvent - padding;
  const rangeEnd = lastEvent + padding;
  const rangeDuration = Math.max(rangeEnd - rangeStart, DAY_MS);
  // 時間ではなく日単位の見通しを優先し、軸ラベルは日付だけを等間隔で表示する。
  const ticks = Array.from({ length: 7 }, (_, index) => ({
    value: rangeStart + (rangeDuration * index) / 6,
    position: (index / 6) * 100,
  }));
  const positionFor = (value: string | number) => {
    const time = typeof value === "number" ? value : parseTime(value);
    return Math.max(0, Math.min(100, ((time - rangeStart) / rangeDuration) * 100));
  };
  const nowPosition = positionFor(now);

  return (
    <section className="isolate overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)]">
      {header}

      <div className="overflow-x-auto px-4 pb-5 pt-4 sm:px-5">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[190px_minmax(620px,1fr)] gap-4 pb-2 text-[11px] text-muted-foreground">
            <span>品種・追熟ロット</span>
            <div className="relative h-7">
              {ticks.map((tick) => (
                <time
                  key={tick.value}
                  className="absolute top-0 -translate-x-1/2 whitespace-nowrap font-bold text-kiwi-ink first:translate-x-0 last:-translate-x-full"
                  style={{ left: `${tick.position}%` }}
                >
                  {formatTick(tick.value)}
                </time>
              ))}
              <span
                className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700"
                style={{ left: `${nowPosition}%` }}
              >
                現在
              </span>
            </div>
          </div>

          <div>
            {items.map((item) => {
              const palette = palettes[Math.abs(item.ripeningNo) % palettes.length];
              const start = positionFor(item.startedAt);
              const ethyleneEnd = positionFor(item.ethyleneEndedAt);
              const shippable = positionFor(item.shippableAt);
              const ethyleneWidth = Math.max(0.7, ethyleneEnd - start);
              const restingWidth = Math.max(0.7, shippable - ethyleneEnd);
              const status = statusFor(item, now);
              const label = (
                <>
                  <span className="block truncate font-bold text-kiwi-ink">{item.varietyName}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    No. {item.ripeningNo}・{item.locationName}・{item.weightKg.toLocaleString("ja-JP")} kg
                  </span>
                  <span className="mt-1.5 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-kiwi-ink">
                    {status}
                  </span>
                </>
              );

              return (
                <div
                  key={item.id}
                  className="grid min-h-24 grid-cols-[190px_minmax(620px,1fr)] items-center gap-4 border-t"
                >
                  <div className="min-w-0 py-3">
                    {item.href ? (
                      <Link href={item.href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                        {label}
                      </Link>
                    ) : label}
                  </div>
                  <div className="relative h-20" aria-label={`${item.varietyName} No. ${item.ripeningNo}の追熟工程`}>
                    {ticks.map((tick) => (
                      <span
                        key={tick.value}
                        className="absolute inset-y-0 w-px bg-border/70"
                        style={{ left: `${tick.position}%` }}
                      />
                    ))}
                    <span
                      className="absolute inset-y-0 z-20 w-px bg-red-400"
                      style={{ left: `${nowPosition}%` }}
                    />
                    <span
                      title={`開始 ${formatDateTime(item.startedAt)} / 終了 ${formatDateTime(item.ethyleneEndedAt)}`}
                      className={cn("absolute top-6 z-10 flex h-7 items-center overflow-hidden rounded-l-full px-2 text-[10px] font-bold text-white", palette.solid)}
                      style={{ left: `${start}%`, width: `${ethyleneWidth}%` }}
                    >
                      エチレン
                    </span>
                    <span
                      title={`保管 ${formatDateTime(item.ethyleneEndedAt)} / 出荷可能 ${formatDateTime(item.shippableAt)}`}
                      className={cn("absolute top-6 z-10 flex h-7 items-center overflow-hidden rounded-r-full px-2 text-[10px] font-bold text-kiwi-ink", palette.soft)}
                      style={{ left: `${ethyleneEnd}%`, width: `${restingWidth}%` }}
                    >
                      保管
                    </span>
                    <span
                      title={`出荷可能 ${formatDateTime(item.shippableAt)}`}
                      className={cn("absolute top-[1.35rem] z-20 size-9 -translate-x-1/2 rounded-full border-[3px] bg-white shadow-sm", palette.ring)}
                      style={{ left: `${shippable}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

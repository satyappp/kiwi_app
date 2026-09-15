import { BellRing, Clock3, Flame, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  completeRipening,
  confirmEthyleneRemoval,
} from "@/features/ripening/actions";
import type { RipeningStatus } from "@/features/ripening/schema";

const JST = "Asia/Tokyo";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

function nextCheckLabel(status: RipeningStatus) {
  return status.nextCheckType === "ethylene_end"
    ? "エチレン終了を確認"
    : "出荷可能を確認";
}

function StatusFlag({ status }: { status: RipeningStatus }) {
  if (status.isOverdue) {
    return (
      <span className="rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-white">
        確認期限超過
      </span>
    );
  }
  if (status.isDueSoon) {
    return (
      <span className="rounded-full bg-kiwi-amber px-2.5 py-1 text-[11px] font-bold text-kiwi-brown">
        まもなく確認
      </span>
    );
  }
  return null;
}

/** At-a-glance answers for what is processing and what must be checked next. */
export function RipeningStatusPanel({ statuses }: { statuses: RipeningStatus[] }) {
  const processing = statuses.filter((status) => status.isEthyleneProcessing);
  const nextCheck = statuses.find((status) => status.nextCheckAt !== null);

  return (
    <section className="mb-7 space-y-3" aria-labelledby="ripening-status-title">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-kiwi-amber/35 text-kiwi-brown">
            <Flame className="size-4" strokeWidth={2.4} />
          </span>
          <h2 id="ripening-status-title" className="text-[15px] font-bold text-kiwi-ink">
            現在のエチレン処理
          </h2>
        </div>
        <span className="text-xs font-bold tabular-nums text-muted-foreground">
          {processing.length}件
        </span>
      </div>

      {processing.length === 0 ? (
        <div className="rounded-2xl border border-kiwi-pale bg-white/80 px-4 py-4 text-sm text-muted-foreground shadow-sm">
          現在エチレン処理中のロットはありません。
        </div>
      ) : (
        <div className="space-y-2.5">
          {processing.slice(0, 3).map((status) => (
            <article
              key={status.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                status.isOverdue
                  ? "border-destructive/35 bg-destructive/8"
                  : "border-kiwi-amber/70 bg-white/90"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-kiwi-ink">
                    {status.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {status.sortingTitles.join("・") || status.varietyName}
                  </p>
                </div>
                <StatusFlag status={status} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-kiwi-brown">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{status.locationName}</span>
                </div>
                <div className="text-right font-bold tabular-nums text-kiwi-ink">
                  {formatWeight(status.weightKg)} kg
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-kiwi-amber/25 px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-kiwi-brown">
                  <Clock3 className="size-3.5" />
                  エチレン終了
                </span>
                <time className="text-sm font-bold tabular-nums text-kiwi-ink">
                  {formatDateTime(status.ethyleneEndedAt)}
                </time>
              </div>
              {status.isOverdue && (
                <form action={confirmEthyleneRemoval} className="mt-3">
                  <input type="hidden" name="batchId" value={status.id} />
                  <Button type="submit" className="h-10 w-full rounded-xl font-bold">
                    エチレン終了を記録
                  </Button>
                </form>
              )}
            </article>
          ))}
        </div>
      )}

      {nextCheck && nextCheck.nextCheckAt && (
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${
            nextCheck.isOverdue
              ? "bg-destructive text-white"
              : "bg-kiwi-ink text-white"
          }`}
        >
          <BellRing className="size-5 shrink-0" strokeWidth={2.2} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium opacity-75">次の確認</p>
            <p className="truncate text-sm font-bold">
              {nextCheckLabel(nextCheck)}・{nextCheck.locationName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <time className="block text-sm font-bold tabular-nums">
              {formatDateTime(nextCheck.nextCheckAt)}
            </time>
            {nextCheck.isOverdue && nextCheck.nextCheckType === "shippable" && (
              <form action={completeRipening} className="mt-1.5">
                <input type="hidden" name="batchId" value={nextCheck.id} />
                <button type="submit" className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                  確認済みにする
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

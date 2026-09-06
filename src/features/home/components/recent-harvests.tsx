import Link from "next/link";
import { ChevronRight, Sprout } from "lucide-react";

import type { HarvestLogRow } from "@/features/harvest";

export function RecentHarvests({ rows }: { rows: HarvestLogRow[] }) {
  return (
    <section className="mt-6 px-[7%] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full border-[1.5px] border-kiwi/50">
            <Sprout className="size-3.5 text-kiwi" />
          </span>
          <h2 className="text-[clamp(0.95rem,4.4cqw,1.1rem)] font-bold text-kiwi-ink">最近の収穫</h2>
        </div>
        <Link href="/harvest" className="flex items-center gap-0.5 text-[clamp(0.75rem,3.3cqw,0.85rem)] font-bold text-kiwi">
          すべて見る <ChevronRight className="size-3.5" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white/80 px-4 py-8 text-center text-xs text-muted-foreground shadow-sm">収穫記録はまだありません。</div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-[0_6px_18px_-8px_rgba(55,75,35,.16)]">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-kiwi-pale/50"><Sprout className="size-[18px] text-kiwi" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-kiwi-ink">{row.varietyName}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.workDate} ・ {row.plotName}</p>
              </div>
              <strong className="shrink-0 text-sm tabular-nums text-kiwi-ink">{row.weightKg.toLocaleString("ja-JP", { maximumFractionDigits: 2 })} kg</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

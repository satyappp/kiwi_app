import { HarvestStatusBadge } from "@/features/harvest/components/harvest-status-badge";
import type { HarvestLogRow } from "@/features/harvest/schema";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00+09:00`));
}

export function HarvestCardList({ rows }: { rows: HarvestLogRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 px-5 py-12 text-center text-sm text-muted-foreground shadow-sm">
        収穫記録はまだありません。
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.id} className="rounded-2xl bg-white/88 p-4 shadow-[0_8px_24px_-14px_rgba(55,75,35,0.28)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-kiwi-ink">{row.varietyName}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {row.plotName}
                {[row.treeBlockName, row.branch].filter(Boolean).length > 0 &&
                  `・${[row.treeBlockName, row.branch].filter(Boolean).join("・")}`}
              </p>
            </div>
            <p className="shrink-0 text-lg font-bold tabular-nums text-kiwi-ink">
              {row.weightKg.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
              <span className="ml-1 text-xs font-medium text-muted-foreground">kg</span>
            </p>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-kiwi/10 pt-3">
            <div className="text-xs leading-relaxed text-muted-foreground">
              <p>{formatDate(row.workDate)} ・ {row.staffName}</p>
              <p>選果期限 {formatDate(row.sortingDeadline)}</p>
            </div>
            <HarvestStatusBadge status={row.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

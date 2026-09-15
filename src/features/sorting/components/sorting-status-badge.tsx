import type { SortingStatus } from "@/features/sorting/schema";

const statusConfig: Record<
  SortingStatus,
  { label: string; className: string }
> = {
  allocated: { label: "追熟割当済", className: "bg-kiwi-pale/55 text-kiwi-ink" },
  partial: { label: "一部使用", className: "bg-sky-100 text-sky-800" },
  overdue: { label: "期限超過", className: "bg-red-100 text-red-800" },
  "due-soon": { label: "期限間近", className: "bg-amber-100 text-amber-800" },
  pending: { label: "未使用", className: "bg-muted text-muted-foreground" },
};

export function SortingStatusBadge({ status }: { status: SortingStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

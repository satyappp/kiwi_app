import { Badge } from "@/components/ui/badge";
import type { HarvestStatus } from "@/features/harvest/schema";
import { cn } from "@/lib/utils";

const statusDetails: Record<HarvestStatus, { label: string; className: string }> = {
  completed: {
    label: "選果完了",
    className: "border-transparent bg-kiwi-pale/65 text-kiwi-ink",
  },
  overdue: {
    label: "期限超過",
    className: "border-transparent bg-red-50 text-red-700",
  },
  "due-soon": {
    label: "期限間近",
    className: "border-transparent bg-amber-100 text-amber-800",
  },
  pending: {
    label: "未選果",
    className: "border-transparent bg-secondary text-muted-foreground",
  },
};

export function HarvestStatusBadge({ status }: { status: HarvestStatus }) {
  const details = statusDetails[status];
  return (
    <Badge variant="outline" className={cn("font-bold", details.className)}>
      {details.label}
    </Badge>
  );
}

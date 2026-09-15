import { ExternalLink, Printer } from "lucide-react";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RipeningHistoryRow } from "@/features/ripening/schema";

const phaseLabels: Record<RipeningHistoryRow["phase"], string> = {
  scheduled: "開始前",
  ethylene_processing: "エチレン処理中",
  post_ethylene_processing: "寝かせ中",
  ready_to_ship: "出荷可能",
  completed: "完了",
  cancelled: "取消",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RipeningHistoryTable({ rows }: { rows: RipeningHistoryRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-14 text-center text-sm text-muted-foreground">
        追熟記録はまだありません。
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">追熟ID</TableHead>
          <TableHead>開始</TableHead>
          <TableHead>品種</TableHead>
          <TableHead>追熟場所</TableHead>
          <TableHead className="text-right">量</TableHead>
          <TableHead>状態</TableHead>
          <TableHead className="px-4 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="px-4 font-bold text-kiwi-ink">
              No. {row.ripeningNo}
            </TableCell>
            <TableCell>{formatDate(row.startedAt)}</TableCell>
            <TableCell className="font-medium">{row.varietyName}</TableCell>
            <TableCell>{row.locationName}</TableCell>
            <TableCell className="text-right font-bold tabular-nums">
              {row.weightKg.toLocaleString("ja-JP", {
                maximumFractionDigits: 2,
              })} kg
            </TableCell>
            <TableCell>{phaseLabels[row.phase]}</TableCell>
            <TableCell className="px-4">
              <div className="flex justify-end gap-2">
                <Link
                  href={`/dashboard/ripening/${row.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold text-kiwi-ink hover:bg-muted"
                >
                  <ExternalLink className="size-3.5" />
                  詳細
                </Link>
                <Link
                  href={`/ripening/${row.id}/label`}
                  target="_blank"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/80"
                >
                  <Printer className="size-3.5" />
                  印刷
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

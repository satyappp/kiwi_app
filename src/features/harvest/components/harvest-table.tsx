import { HarvestStatusBadge } from "@/features/harvest/components/harvest-status-badge";
import type { HarvestLogRow } from "@/features/harvest/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00+09:00`));
}

function formatWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function HarvestTable({ rows }: { rows: HarvestLogRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="grid min-h-52 place-items-center px-6 text-center text-sm text-muted-foreground">
        収穫記録はまだありません。
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-5 text-muted-foreground">作業日</TableHead>
          <TableHead className="text-muted-foreground">品種</TableHead>
          <TableHead className="text-muted-foreground">番地・樹体</TableHead>
          <TableHead className="text-right text-muted-foreground">収穫量</TableHead>
          <TableHead className="text-right text-muted-foreground">未選果</TableHead>
          <TableHead className="text-muted-foreground">選果期限</TableHead>
          <TableHead className="text-muted-foreground">担当者</TableHead>
          <TableHead className="pr-5 text-muted-foreground">状態</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="pl-5 font-medium">{formatDate(row.workDate)}</TableCell>
            <TableCell className="font-bold text-kiwi-ink">{row.varietyName}</TableCell>
            <TableCell>
              <div className="max-w-56 truncate">{row.plotName}</div>
              {(row.treeBlockName || row.branch) && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {[row.treeBlockName, row.branch].filter(Boolean).join("・")}
                </div>
              )}
            </TableCell>
            <TableCell className="text-right font-bold tabular-nums">
              {formatWeight(row.weightKg)} kg
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatWeight(row.remainingWeightKg)} kg
            </TableCell>
            <TableCell>{formatDate(row.sortingDeadline)}</TableCell>
            <TableCell>{row.staffName}</TableCell>
            <TableCell className="pr-5">
              <HarvestStatusBadge status={row.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

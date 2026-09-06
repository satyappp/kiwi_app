"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

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

type SortKey =
  | "workDate"
  | "varietyName"
  | "plotName"
  | "weightKg"
  | "remainingWeightKg"
  | "sortingDeadline"
  | "staffName";

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: "asc" | "desc";
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const Icon = activeKey !== sortKey ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 rounded-md py-1 font-medium hover:text-kiwi-ink ${align === "right" ? "ml-auto" : ""}`}
    >
      {label}
      <Icon className="size-3.5 opacity-60" />
    </button>
  );
}

export function HarvestTable({
  rows,
  sortable = false,
  pageSize,
}: {
  rows: HarvestLogRow[];
  sortable?: boolean;
  pageSize?: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("workDate");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const sortedRows = useMemo(() => {
    if (!sortable) return rows;
    return [...rows].sort((a, b) => {
      const first = a[sortKey];
      const second = b[sortKey];
      const result =
        typeof first === "number" && typeof second === "number"
          ? first - second
          : String(first).localeCompare(String(second), "ja");
      return direction === "asc" ? result : -result;
    });
  }, [direction, rows, sortKey, sortable]);
  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const displayedRows = pageSize
    ? sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedRows;

  function handleSort(key: SortKey) {
    setPage(1);
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection(key === "workDate" || key === "weightKg" ? "desc" : "asc");
  }

  if (rows.length === 0) {
    return (
      <div className="grid min-h-52 place-items-center px-6 text-center text-sm text-muted-foreground">
        収穫記録はまだありません。
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 text-muted-foreground">{sortable ? <SortHeader label="作業日" sortKey="workDate" activeKey={sortKey} direction={direction} onSort={handleSort} /> : "作業日"}</TableHead>
            <TableHead className="text-muted-foreground">{sortable ? <SortHeader label="品種" sortKey="varietyName" activeKey={sortKey} direction={direction} onSort={handleSort} /> : "品種"}</TableHead>
            <TableHead className="text-muted-foreground">{sortable ? <SortHeader label="番地・樹体" sortKey="plotName" activeKey={sortKey} direction={direction} onSort={handleSort} /> : "番地・樹体"}</TableHead>
            <TableHead className="text-right text-muted-foreground">{sortable ? <SortHeader label="収穫量" sortKey="weightKg" activeKey={sortKey} direction={direction} onSort={handleSort} align="right" /> : "収穫量"}</TableHead>
            <TableHead className="text-right text-muted-foreground">{sortable ? <SortHeader label="未選果" sortKey="remainingWeightKg" activeKey={sortKey} direction={direction} onSort={handleSort} align="right" /> : "未選果"}</TableHead>
            <TableHead className="text-muted-foreground">{sortable ? <SortHeader label="選果期限" sortKey="sortingDeadline" activeKey={sortKey} direction={direction} onSort={handleSort} /> : "選果期限"}</TableHead>
            <TableHead className="text-muted-foreground">{sortable ? <SortHeader label="担当者" sortKey="staffName" activeKey={sortKey} direction={direction} onSort={handleSort} /> : "担当者"}</TableHead>
            <TableHead className="pr-5 text-muted-foreground">状態</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedRows.map((row) => (
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
      {pageSize && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground">
          <span>
            {((currentPage - 1) * pageSize + 1).toLocaleString("ja-JP")}–{Math.min(currentPage * pageSize, rows.length).toLocaleString("ja-JP")} / {rows.length.toLocaleString("ja-JP")}件
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="前のページ"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="grid size-9 place-items-center rounded-lg border bg-white text-kiwi-ink transition hover:bg-kiwi-pale/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-16 text-center font-medium tabular-nums text-kiwi-ink">{currentPage} / {totalPages}</span>
            <button
              type="button"
              aria-label="次のページ"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="grid size-9 place-items-center rounded-lg border bg-white text-kiwi-ink transition hover:bg-kiwi-pale/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

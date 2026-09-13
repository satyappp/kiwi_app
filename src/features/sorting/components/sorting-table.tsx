"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortingStatusBadge } from "@/features/sorting/components/sorting-status-badge";
import type { SortingLogRow } from "@/features/sorting/schema";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00+09:00`));
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

type SortKey =
  | "sortingDate"
  | "varietyName"
  | "plotName"
  | "sizeCode"
  | "weightKg"
  | "allocatedWeightKg"
  | "availableWeightKg"
  | "ethyleneStartDeadline"
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
  const Icon =
    activeKey !== sortKey
      ? ChevronsUpDown
      : direction === "asc"
        ? ArrowUp
        : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 rounded-md py-1 font-medium hover:text-kiwi-ink ${
        align === "right" ? "ml-auto" : ""
      }`}
    >
      {label}
      <Icon className="size-3.5 opacity-60" />
    </button>
  );
}

export function SortingTable({ rows }: { rows: SortingLogRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("sortingDate");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const first = a[sortKey];
        const second = b[sortKey];
        const result =
          typeof first === "number" && typeof second === "number"
            ? first - second
            : String(first).localeCompare(String(second), "ja");
        return direction === "asc" ? result : -result;
      }),
    [direction, rows, sortKey],
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const displayedRows = sortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function handleSort(key: SortKey) {
    setPage(1);
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection(
      key === "sortingDate" || key.endsWith("WeightKg") ? "desc" : "asc",
    );
  }

  if (rows.length === 0) {
    return (
      <div className="grid min-h-52 place-items-center px-6 text-center text-sm text-muted-foreground">
        選果記録はまだありません。
      </div>
    );
  }

  const header = (
    label: string,
    key: SortKey,
    align: "left" | "right" = "left",
  ) => (
    <SortHeader
      label={label}
      sortKey={key}
      activeKey={sortKey}
      direction={direction}
      onSort={handleSort}
      align={align}
    />
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 text-muted-foreground">{header("選果日", "sortingDate")}</TableHead>
            <TableHead className="text-muted-foreground">{header("品種", "varietyName")}</TableHead>
            <TableHead className="text-muted-foreground">元の収穫・園地</TableHead>
            <TableHead className="text-muted-foreground">{header("等級", "sizeCode")}</TableHead>
            <TableHead className="text-right text-muted-foreground">{header("選果量", "weightKg", "right")}</TableHead>
            <TableHead className="text-right text-muted-foreground">{header("追熟使用済", "allocatedWeightKg", "right")}</TableHead>
            <TableHead className="text-right text-muted-foreground">{header("使用可能", "availableWeightKg", "right")}</TableHead>
            <TableHead className="text-muted-foreground">{header("エチレン期限", "ethyleneStartDeadline")}</TableHead>
            <TableHead className="text-muted-foreground">{header("担当者", "staffName")}</TableHead>
            <TableHead className="text-muted-foreground">状態</TableHead>
            <TableHead className="pr-5 text-right text-muted-foreground">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="pl-5 font-medium">
                {formatDate(row.sortingDate)}
                <div className="mt-0.5 whitespace-nowrap text-[11px] text-muted-foreground">
                  入力 {formatDateTime(row.inputTs)}
                </div>
              </TableCell>
              <TableCell className="font-bold text-kiwi-ink">{row.varietyName}</TableCell>
              <TableCell>
                <div className="max-w-52 truncate" title={row.harvestTitle}>{row.harvestTitle}</div>
                <div className="mt-0.5 max-w-52 truncate text-xs text-muted-foreground">{row.plotName}・選果期限 {formatDate(row.sortingDeadline)}</div>
              </TableCell>
              <TableCell>
                <span className="font-bold text-kiwi-ink">{row.sizeCode}</span>
                <div className="mt-0.5 whitespace-nowrap text-xs text-muted-foreground">{row.sizeName}</div>
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums">{formatWeight(row.weightKg)} kg</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{formatWeight(row.allocatedWeightKg)} kg</TableCell>
              <TableCell className="text-right font-bold tabular-nums text-kiwi-ink">{formatWeight(row.availableWeightKg)} kg</TableCell>
              <TableCell>{formatDate(row.ethyleneStartDeadline)}</TableCell>
              <TableCell>{row.staffName}</TableCell>
              <TableCell><SortingStatusBadge status={row.status} /></TableCell>
              <TableCell className="pr-5">
                <div className="flex justify-end gap-2">
                  <Link href={`/dashboard/sorting/${row.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold text-kiwi-ink hover:bg-muted">
                    <Eye className="size-3.5" /> 詳細
                  </Link>
                  <Link href={`/sorting/${row.id}/label`} target="_blank" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/80">
                    <Printer className="size-3.5" /> 印刷
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground">
          <span>{((currentPage - 1) * pageSize + 1).toLocaleString("ja-JP")}–{Math.min(currentPage * pageSize, rows.length).toLocaleString("ja-JP")} / {rows.length.toLocaleString("ja-JP")}件</span>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="前のページ" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center rounded-lg border bg-white text-kiwi-ink transition hover:bg-kiwi-pale/20 disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-16 text-center font-medium tabular-nums text-kiwi-ink">{currentPage} / {totalPages}</span>
            <button type="button" aria-label="次のページ" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid size-9 place-items-center rounded-lg border bg-white text-kiwi-ink transition hover:bg-kiwi-pale/20 disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

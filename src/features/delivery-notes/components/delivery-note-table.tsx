"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FilePenLine,
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
import { deliveryNoteItemName, formatKg, formatYen } from "@/features/delivery-notes/format";
import type { DeliveryNoteData } from "@/features/delivery-notes/schema";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00+09:00`));
}

type SortKey = "deliveryDate" | "documentNumber" | "recipientName" | "totalYen";

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
  const Icon = activeKey !== sortKey
    ? ChevronsUpDown
    : direction === "asc"
      ? ArrowUp
      : ArrowDown;
  return (
    <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 rounded-md py-1 font-medium hover:text-kiwi-ink ${align === "right" ? "ml-auto" : ""}`}>
      {label}<Icon className="size-3.5 opacity-60" />
    </button>
  );
}

export function DeliveryNoteTable({ rows }: { rows: DeliveryNoteData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("deliveryDate");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => {
      const first = a[sortKey];
      const second = b[sortKey];
      const result = typeof first === "number" && typeof second === "number"
        ? first - second
        : String(first).localeCompare(String(second), "ja");
      return direction === "asc" ? result : -result;
    }),
    [direction, rows, sortKey],
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const displayedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function handleSort(key: SortKey) {
    setPage(1);
    if (key === sortKey) {
      setDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setDirection(key === "deliveryDate" || key === "totalYen" ? "desc" : "asc");
  }

  if (rows.length === 0) {
    return <div className="grid min-h-52 place-items-center px-6 text-center text-sm text-muted-foreground">出荷記録がまだありません。</div>;
  }

  const header = (label: string, key: SortKey, align: "left" | "right" = "left") => (
    <SortHeader label={label} sortKey={key} activeKey={sortKey} direction={direction} onSort={handleSort} align={align} />
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5 text-muted-foreground">{header("納品日", "deliveryDate")}</TableHead>
            <TableHead className="text-muted-foreground">{header("納品書番号", "documentNumber")}</TableHead>
            <TableHead className="text-muted-foreground">{header("取引先", "recipientName")}</TableHead>
            <TableHead className="text-muted-foreground">品名</TableHead>
            <TableHead className="text-right text-muted-foreground">数量</TableHead>
            <TableHead className="text-right text-muted-foreground">{header("合計金額", "totalYen", "right")}</TableHead>
            <TableHead className="text-muted-foreground">担当者</TableHead>
            <TableHead className="text-muted-foreground">状態</TableHead>
            <TableHead className="pr-5 text-right text-muted-foreground">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="pl-5 whitespace-nowrap font-medium">{formatDate(row.deliveryDate)}</TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">{row.documentNumber}</TableCell>
              <TableCell className="max-w-48 truncate font-bold text-kiwi-ink" title={row.recipientName}>{row.recipientShortName}</TableCell>
              <TableCell className="max-w-64 truncate" title={deliveryNoteItemName(row)}>{deliveryNoteItemName(row)}</TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">{formatKg(row.quantityKg)} kg</TableCell>
              <TableCell className="text-right whitespace-nowrap font-bold tabular-nums text-kiwi-ink">{formatYen(row.totalYen)}</TableCell>
              <TableCell className="whitespace-nowrap">{row.staffName}</TableCell>
              <TableCell>
                <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${row.cancelledAt ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-kiwi-ink"}`}>
                  {row.cancelledAt ? "取消" : "作成可能"}
                </span>
              </TableCell>
              <TableCell className="pr-5">
                <div className="flex justify-end gap-2">
                  <Link href={`/dashboard/delivery-notes/${row.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/80">
                    <FilePenLine className="size-3.5" />編集・PDF
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground">
          <span>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} / {rows.length}件</span>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="前のページ" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center rounded-lg border bg-white text-kiwi-ink disabled:opacity-40"><ChevronLeft className="size-4" /></button>
            <span className="min-w-16 text-center font-medium text-kiwi-ink">{currentPage} / {totalPages}</span>
            <button type="button" aria-label="次のページ" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid size-9 place-items-center rounded-lg border bg-white text-kiwi-ink disabled:opacity-40"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ShippingSaleRow } from "@/features/shipping/schema";

type SortKey = "shippingDate" | "deliveryDate" | "partnerName" | "varietyName" | "sizeCode" | "quantityKg" | "unitPriceYenPerKg" | "totalPriceYen" | "staffName" | "status";
const statusLabel = { reserved: "予約済み", shipped: "出荷済み", cancelled: "取消" } as const;
const statusClass = { reserved: "bg-amber-100 text-amber-800", shipped: "bg-primary/10 text-kiwi-ink", cancelled: "bg-muted text-muted-foreground" } as const;

function formatDate(value: string) { return value.replaceAll("-", "/"); }
function formatNumber(value: number) { return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 }); }

function SortHeader({ label, value, active, direction, onSort, align = "left" }: { label: string; value: SortKey; active: SortKey; direction: "asc" | "desc"; onSort: (key: SortKey) => void; align?: "left" | "right" }) {
  const Icon = active !== value ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return <button type="button" onClick={() => onSort(value)} className={`inline-flex items-center gap-1 rounded-md py-1 font-medium hover:text-kiwi-ink ${align === "right" ? "ml-auto" : ""}`}>{label}<Icon className="size-3.5 opacity-60" /></button>;
}

export function ShippingSalesTable({ rows }: { rows: ShippingSaleRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("shippingDate");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const first = a[sortKey]; const second = b[sortKey];
    const result = typeof first === "number" && typeof second === "number" ? first - second : String(first).localeCompare(String(second), "ja");
    return direction === "asc" ? result : -result;
  }), [direction, rows, sortKey]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const displayed = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  function handleSort(key: SortKey) { setPage(1); if (key === sortKey) { setDirection((value) => value === "asc" ? "desc" : "asc"); return; } setSortKey(key); setDirection(key.endsWith("Date") || key.endsWith("Kg") || key.endsWith("Yen") ? "desc" : "asc"); }
  const header = (label: string, key: SortKey, align: "left" | "right" = "left") => <SortHeader label={label} value={key} active={sortKey} direction={direction} onSort={handleSort} align={align} />;

  if (rows.length === 0) return <div className="grid min-h-52 place-items-center px-6 text-center text-sm text-muted-foreground">出荷・販売記録はまだありません。</div>;
  return <>
    <Table><TableHeader><TableRow className="hover:bg-transparent">
      <TableHead className="pl-5">{header("出荷日", "shippingDate")}</TableHead><TableHead>{header("納品日", "deliveryDate")}</TableHead><TableHead>{header("取引先", "partnerName")}</TableHead><TableHead>{header("品種", "varietyName")}</TableHead><TableHead>{header("サイズ", "sizeCode")}</TableHead><TableHead>納品形態</TableHead><TableHead className="text-right">{header("数量", "quantityKg", "right")}</TableHead><TableHead className="text-right">{header("単価", "unitPriceYenPerKg", "right")}</TableHead><TableHead className="text-right">{header("金額", "totalPriceYen", "right")}</TableHead><TableHead>{header("担当者", "staffName")}</TableHead><TableHead className="pr-5">{header("状態", "status")}</TableHead>
    </TableRow></TableHeader><TableBody>{displayed.map((row) => <TableRow key={row.id}>
      <TableCell className="pl-5 font-medium">{formatDate(row.shippingDate)}</TableCell><TableCell>{formatDate(row.deliveryDate)}</TableCell><TableCell className="font-bold text-kiwi-ink">{row.partnerName}</TableCell><TableCell>{row.varietyName}</TableCell><TableCell className="font-bold">{row.sizeCode}</TableCell><TableCell><div className="max-w-52 truncate" title={row.packageName ?? undefined}>{row.packageName ?? "—"}</div></TableCell><TableCell className="text-right font-bold tabular-nums">{formatNumber(row.quantityKg)} kg</TableCell><TableCell className="text-right tabular-nums">¥{formatNumber(row.unitPriceYenPerKg)}</TableCell><TableCell className="text-right font-bold tabular-nums text-kiwi-ink">¥{row.totalPriceYen.toLocaleString("ja-JP")}</TableCell><TableCell>{row.staffName}</TableCell><TableCell className="pr-5"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${statusClass[row.status]}`}>{statusLabel[row.status]}</span></TableCell>
    </TableRow>)}</TableBody></Table>
    {totalPages > 1 && <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground"><span>{((currentPage - 1) * pageSize + 1).toLocaleString("ja-JP")}–{Math.min(currentPage * pageSize, rows.length).toLocaleString("ja-JP")} / {rows.length.toLocaleString("ja-JP")}件</span><div className="flex items-center gap-2"><button type="button" aria-label="前のページ" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center rounded-lg border bg-white disabled:opacity-40"><ChevronLeft className="size-4" /></button><span className="min-w-16 text-center font-medium text-kiwi-ink">{currentPage} / {totalPages}</span><button type="button" aria-label="次のページ" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid size-9 place-items-center rounded-lg border bg-white disabled:opacity-40"><ChevronRight className="size-4" /></button></div></div>}
  </>;
}

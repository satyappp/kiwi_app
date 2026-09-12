"use client";

import { useMemo, useState } from "react";
import {
  BookmarkCheck,
  PackageCheck,
  Snowflake,
  Timer,
  Truck,
} from "lucide-react";

import { NativeSelect } from "@/components/ui/native-select";
import type {
  InventoryRow,
  InventoryStatus,
  InventoryVariety,
} from "@/features/inventory/schema";

const statusOptions: Array<{
  value: InventoryStatus;
  label: string;
}> = [
  { value: "cold", label: "冷蔵中" },
  { value: "ripening", label: "追熟中" },
  { value: "ready", label: "出荷可能" },
  { value: "reserved", label: "予約済み" },
  { value: "shipped", label: "出荷済み" },
];

const statusIcons = {
  cold: Snowflake,
  ripening: Timer,
  ready: PackageCheck,
  reserved: BookmarkCheck,
  shipped: Truck,
} satisfies Record<InventoryStatus, typeof Snowflake>;

function formatWeight(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

export function InventoryBrowser({
  varieties,
  rows,
}: {
  varieties: InventoryVariety[];
  rows: InventoryRow[];
}) {
  const [varietyId, setVarietyId] = useState("");
  const [status, setStatus] = useState<InventoryStatus>("cold");
  const filteredRows = useMemo(
    () => rows.filter((row) => row.varietyId === varietyId && row.status === status),
    [rows, status, varietyId],
  );
  const totalWeight = filteredRows.reduce((sum, row) => sum + row.weightKg, 0);
  const selectedStatus = statusOptions.find((option) => option.value === status)!;
  const StatusIcon = statusIcons[status];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <label htmlFor="inventory-variety" className="mb-2 block text-sm font-bold text-kiwi-ink">
          キウイの種類
        </label>
        <NativeSelect
          id="inventory-variety"
          value={varietyId}
          onChange={(event) => setVarietyId(event.target.value)}
        >
          <option value="">品種を選択してください</option>
          {varieties.map((variety) => (
            <option key={variety.id} value={variety.id}>{variety.name}</option>
          ))}
        </NativeSelect>
      </section>

      {!varietyId ? (
        <div className="rounded-2xl border border-dashed border-kiwi/25 bg-white/75 px-5 py-12 text-center">
          <Snowflake className="mx-auto mb-3 size-9 text-kiwi/55" />
          <p className="font-bold text-kiwi-ink">品種を選択してください</p>
          <p className="mt-1 text-sm text-muted-foreground">
            選択すると工程別の在庫を確認できます
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <label htmlFor="inventory-status" className="mb-2 block text-sm font-bold text-kiwi-ink">
              在庫の状態
            </label>
            <NativeSelect
              id="inventory-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as InventoryStatus)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect>
          </section>

          <section className="flex items-center justify-between rounded-2xl bg-kiwi px-5 py-4 text-white shadow-md">
            <div className="flex items-center gap-3">
              <StatusIcon className="size-6" />
              <div>
                <p className="text-xs text-white/75">{selectedStatus.label}の合計</p>
                <p className="text-lg font-bold">{filteredRows.length}件</p>
              </div>
            </div>
            <p className="text-2xl font-bold">{formatWeight(totalWeight)} kg</p>
          </section>

          <div className="space-y-3">
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl bg-white/85 px-5 py-10 text-center text-sm text-muted-foreground shadow-sm">
                該当する在庫はありません
              </div>
            ) : filteredRows.map((row) => (
              <article key={`${row.status}-${row.sourceId}`} className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-kiwi-ink">{row.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[row.plotName, row.sizeName, row.locationName].filter(Boolean).join("・") || row.varietyName}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-bold text-kiwi">{formatWeight(row.weightKg)} kg</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-kiwi-tan/50 pt-3 text-xs text-muted-foreground">
                  <span>{formatDate(row.occurredAt)}</span>
                  {row.deadlineAt && <span>期限 {formatDate(row.deadlineAt)}</span>}
                  {row.customerName && <span>取引先 {row.customerName}</span>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

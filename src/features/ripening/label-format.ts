import type { RipeningLabelData } from "@/features/ripening/schema";

const JST = "Asia/Tokyo";

export function formatLabelDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("month")}月${part("day")}日 ${part("hour")}時`;
}

export function formatLabelRange(start: string, end: string) {
  return `${formatLabelDateTime(start)} ～ ${formatLabelDateTime(end)}`;
}

export function formatLabelWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function formatLabelTemperature(value: number | null) {
  return value === null ? "　 ℃" : `${value.toLocaleString("ja-JP")} ℃`;
}

export const blankRestingRange = "　 ℃　　月　日　時 ～　　月　日　時";

export function labelBreakdownLines(data: RipeningLabelData) {
  const itemLines = data.breakdown.map((item) =>
    [
      item.sizeCode || "規格なし",
      `${formatLabelWeight(item.weightKg)} kg`,
      item.plotName,
    ]
      .filter(Boolean)
      .join("　"),
  );
  if (data.notes?.trim()) itemLines.push(`メモ：${data.notes.trim()}`);
  return itemLines.slice(0, 5);
}

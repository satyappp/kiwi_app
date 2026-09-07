import type { HarvestLabelData } from "@/features/harvest/schema";

export function formatHarvestLabelDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

export function formatHarvestLabelTime(value: string | null) {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour}時${minute.toString().padStart(2, "0")}分`;
}

export function formatHarvestLabelWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function harvestLabelBreakdownLines(data: HarvestLabelData) {
  const notes = data.notes
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean) ?? [];
  return notes.length > 0 ? notes.slice(0, 5) : [];
}

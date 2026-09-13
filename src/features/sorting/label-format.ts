import type { SortingLabelData } from "@/features/sorting/schema";

export function formatSortingLabelDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

export function formatSortingLabelWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function sortingLabelBreakdownLines(data: SortingLabelData) {
  return [
    `${data.sizeCode}　${formatSortingLabelWeight(data.weightKg)} kg　${data.plotName}`,
    `追熟使用済　${formatSortingLabelWeight(data.allocatedWeightKg)} kg`,
    `使用可能　${formatSortingLabelWeight(data.availableWeightKg)} kg`,
  ];
}

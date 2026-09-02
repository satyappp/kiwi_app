import { z } from "zod";

export const sortingInputSchema = z.object({
  harvestLogId: z.string().min(1, "元の収穫を選択してください"),
  sizeStandardId: z.string().min(1, "サイズを選択してください"),
  weightKg: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number({ message: "選果量を入力してください" })
      .positive("0より大きい値を入力してください"),
  ),
});

export type SortingInput = z.infer<typeof sortingInputSchema>;

export type StaffOption = {
  id: string;
  name: string;
};

export type SizeStandardOption = {
  id: string;
  code: string;
  name: string;
};

export type HarvestSortingOption = {
  id: string;
  title: string;
  workDate: string;
  plotName: string;
  treeBlockName: string | null;
  varietyName: string;
  sortingDeadline: string;
  harvestedWeightKg: number;
  sortedWeightKg: number;
  remainingWeightKg: number;
};

export type SortingFormOptions = {
  harvests: HarvestSortingOption[];
  sizeStandards: SizeStandardOption[];
};

/** Returns the amount that this entry would exceed the unselected harvest by. */
export function getSortingOverageKg(weightKg: number, remainingWeightKg: number) {
  return Math.max(0, Math.round((weightKg - remainingWeightKg) * 100) / 100);
}

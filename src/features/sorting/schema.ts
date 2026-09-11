import { z } from "zod";

function requiredText(message: string) {
  return z.preprocess(
    (value) => (value === undefined || value === null ? "" : value),
    z.string().min(1, message),
  );
}

/**
 * Domain schema for one sorting entry (選果入力).
 *
 * Only the four values selected or typed by a worker are accepted here:
 *   - 選果日（当日を初期値として変更可能）
 *   - 元の収穫
 *   - サイズ・規格
 *   - 選果量
 *
 * The database derives the signed-in staff member, input timestamp, and
 * ethylene-start deadline. Variety, plot, harvest title, and
 * sorting deadline are inherited through harvest_log_id rather than re-entered.
 * This schema is the single source of truth for both the form and server action.
 */
export const sortingInputSchema = z.object({
  sortingDate: requiredText("選果日を入力してください"), // 選果日
  harvestLogId: requiredText("元の収穫を選択してください"), // 収穫ログID
  sizeStandardId: requiredText("サイズを選択してください"), // サイズ規格ID
  weightKg: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce // 選果量（kg）
      .number({ message: "選果量を入力してください" })
      .min(1, "1 kg以上の値を入力してください"),
  ),
});

export type SortingInput = z.infer<typeof sortingInputSchema>;

/** Signed-in staff displayed as a read-only form value. */
export type StaffOption = {
  id: string;
  name: string;
};

/** Active size/grade master row used by the size dropdown. */
export type SizeStandardOption = {
  id: string;
  code: string;
  name: string;
};

/**
 * A harvest selectable as the source of a sorting entry.
 * Display fields come from harvest_logs_expanded; weights come from
 * harvest_sorting_status so the worker can see the latest remaining amount.
 */
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

/** Returns how many kg this entry would exceed the remaining harvest by. */
export function getSortingOverageKg(weightKg: number, remainingWeightKg: number) {
  return Math.max(0, Math.round((weightKg - remainingWeightKg) * 100) / 100);
}

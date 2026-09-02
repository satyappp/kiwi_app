import type {
  HarvestSortingOption,
  SizeStandardOption,
  SortingFormOptions,
  StaffOption,
} from "@/features/sorting/schema";
import { createClient } from "@/lib/supabase/server";

function toNumber(value: number | string | null) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export async function getSortingFormOptions(): Promise<SortingFormOptions> {
  const supabase = await createClient();
  const [harvestsResult, statusResult, sizeStandardsResult] = await Promise.all([
    supabase
      .from("harvest_logs_expanded")
      .select(
        "work_record_id, title, work_date, plot_name, tree_block_name, variety_name, sorting_deadline",
      )
      .order("work_date", { ascending: false })
      .order("input_ts", { ascending: false }),
    supabase
      .from("harvest_sorting_status")
      .select(
        "harvest_log_id, harvested_weight_kg, sorted_weight_kg, remaining_unsorted_kg",
      ),
    supabase
      .from("size_standards")
      .select("id, code, display_name")
      .eq("is_active", true)
      .order("sort_order")
      .order("code"),
  ]);

  const error =
    harvestsResult.error ?? statusResult.error ?? sizeStandardsResult.error;
  if (error) {
    throw new Error(`選果フォームデータの取得に失敗しました (${error.code})`);
  }

  const statusByHarvestId = new Map(
    (statusResult.data ?? []).map((row) => [row.harvest_log_id, row]),
  );

  const harvests = (harvestsResult.data ?? []).map(
    (row): HarvestSortingOption => {
      const status = statusByHarvestId.get(row.work_record_id);
      return {
        id: row.work_record_id,
        title: row.title,
        workDate: row.work_date,
        plotName: row.plot_name,
        treeBlockName: row.tree_block_name,
        varietyName: row.variety_name,
        sortingDeadline: row.sorting_deadline,
        harvestedWeightKg: toNumber(status?.harvested_weight_kg ?? null),
        sortedWeightKg: toNumber(status?.sorted_weight_kg ?? null),
        remainingWeightKg: toNumber(status?.remaining_unsorted_kg ?? null),
      };
    },
  );

  const sizeStandards = (sizeStandardsResult.data ?? []).map(
    (row): SizeStandardOption => ({
      id: row.id,
      code: row.code,
      name: row.display_name,
    }),
  );

  return { harvests, sizeStandards };
}

export async function getCurrentSortingStaff(): Promise<StaffOption | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return { id: data.id, name: data.display_name };
}

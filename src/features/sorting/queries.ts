import type {
  HarvestSortingOption,
  SizeStandardOption,
  SortingFormOptions,
  StaffOption,
} from "@/features/sorting/schema";
import { requireDbValue } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";

/**
 * Data access for the sorting feature. Only this file (and actions.ts) may
 * query Supabase; presentation components receive camelCase domain objects.
 * Reads use the signed-in session, so database RLS remains authoritative.
 */

/** PostgreSQL numeric values may arrive as strings; normalize them for the UI. */
function toNumber(value: number | string | null) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

/**
 * Fetches all data needed to render the form in parallel:
 * selectable harvests, their current sorting totals, and active size standards.
 */
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

  // Index the aggregate view once instead of repeatedly scanning it per harvest.
  const statusByHarvestId = new Map(
    (statusResult.data ?? []).map((row) => [
      requireDbValue(row.harvest_log_id, "harvest_sorting_status.harvest_log_id"),
      row,
    ]),
  );

  const harvests = (harvestsResult.data ?? []).map(
    (row): HarvestSortingOption => {
      const id = requireDbValue(
        row.work_record_id,
        "harvest_logs_expanded.work_record_id",
      );
      const status = statusByHarvestId.get(id);
      return {
        id,
        title: requireDbValue(row.title, "harvest_logs_expanded.title"),
        workDate: requireDbValue(row.work_date, "harvest_logs_expanded.work_date"),
        plotName: requireDbValue(row.plot_name, "harvest_logs_expanded.plot_name"),
        treeBlockName: row.tree_block_name,
        varietyName: requireDbValue(
          row.variety_name,
          "harvest_logs_expanded.variety_name",
        ),
        sortingDeadline: requireDbValue(
          row.sorting_deadline,
          "harvest_logs_expanded.sorting_deadline",
        ),
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

/** The signed-in staff member, displayed as the read-only 担当者 field. */
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

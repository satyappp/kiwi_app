import type {
  HarvestSortingOption,
  SizeStandardOption,
  SortingLabelData,
  SortingFormOptions,
  SortingLogRow,
  SortingStatus,
  StaffOption,
} from "@/features/sorting/schema";
import type { Database } from "@/lib/supabase/database.types";
import { requireDbValue } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

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

type SortingViewRow = Database["public"]["Views"]["sorting_logs_expanded"]["Row"];
type ExpandedSortingRow = Pick<
  SortingViewRow,
  | "work_record_id"
  | "input_ts"
  | "sorting_date"
  | "harvest_log_id"
  | "harvest_title"
  | "variety_name"
  | "plot_name"
  | "sorting_deadline"
  | "size_code"
  | "size_name"
  | "weight_kg"
  | "ethylene_start_deadline"
  | "staff_name"
>;
type RipeningStatusRow = Pick<
  Database["public"]["Views"]["sorting_ripening_status"]["Row"],
  | "sorting_log_id"
  | "ripening_allocated_weight_kg"
  | "available_weight_kg"
>;

const sortingListColumns =
  "work_record_id, input_ts, sorting_date, harvest_log_id, harvest_title, variety_name, plot_name, sorting_deadline, size_code, size_name, weight_kg, ethylene_start_deadline, staff_name";
const sortingIdSchema = z.string().uuid();

function tokyoDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function statusFor(
  deadline: string,
  allocatedWeightKg: number,
  availableWeightKg: number,
): SortingStatus {
  if (availableWeightKg <= 0) return "allocated";
  const today = tokyoDateString();
  if (deadline < today) return "overdue";
  if (deadline <= addDays(today, 3)) return "due-soon";
  if (allocatedWeightKg > 0) return "partial";
  return "pending";
}

function mapSortingRow(
  row: ExpandedSortingRow,
  ripeningStatus?: RipeningStatusRow,
): SortingLogRow {
  const weightKg = toNumber(row.weight_kg);
  const allocatedWeightKg = toNumber(
    ripeningStatus?.ripening_allocated_weight_kg ?? null,
  );
  const availableWeightKg = ripeningStatus
    ? Math.max(0, toNumber(ripeningStatus.available_weight_kg))
    : weightKg;
  const ethyleneStartDeadline = requireDbValue(
    row.ethylene_start_deadline,
    "sorting_logs_expanded.ethylene_start_deadline",
  );

  return {
    id: requireDbValue(row.work_record_id, "sorting_logs_expanded.work_record_id"),
    inputTs: requireDbValue(row.input_ts, "sorting_logs_expanded.input_ts"),
    sortingDate: requireDbValue(row.sorting_date, "sorting_logs_expanded.sorting_date"),
    harvestLogId: requireDbValue(
      row.harvest_log_id,
      "sorting_logs_expanded.harvest_log_id",
    ),
    harvestTitle: requireDbValue(
      row.harvest_title,
      "sorting_logs_expanded.harvest_title",
    ),
    varietyName: requireDbValue(
      row.variety_name,
      "sorting_logs_expanded.variety_name",
    ),
    plotName: requireDbValue(row.plot_name, "sorting_logs_expanded.plot_name"),
    sortingDeadline: requireDbValue(
      row.sorting_deadline,
      "sorting_logs_expanded.sorting_deadline",
    ),
    sizeCode: requireDbValue(row.size_code, "sorting_logs_expanded.size_code"),
    sizeName: requireDbValue(row.size_name, "sorting_logs_expanded.size_name"),
    weightKg,
    allocatedWeightKg,
    availableWeightKg,
    ethyleneStartDeadline,
    staffName: requireDbValue(
      row.staff_name,
      "sorting_logs_expanded.staff_name",
    ),
    status: statusFor(
      ethyleneStartDeadline,
      allocatedWeightKg,
      availableWeightKg,
    ),
  };
}

/** Selection history with live ripening allocation totals. */
export async function listSortingLogs(limit = 1000): Promise<SortingLogRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("sorting_logs_expanded")
    .select(sortingListColumns)
    .order("sorting_date", { ascending: false })
    .order("input_ts", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`選果履歴の取得に失敗しました (${error.code})`);
  if (!rows?.length) return [];

  const ids = rows.map((row) =>
    requireDbValue(row.work_record_id, "sorting_logs_expanded.work_record_id"),
  );
  const chunks = Array.from(
    { length: Math.ceil(ids.length / 150) },
    (_, index) => ids.slice(index * 150, (index + 1) * 150),
  );
  const statusResults = await Promise.all(
    chunks.map((chunk) =>
      supabase
        .from("sorting_ripening_status")
        .select(
          "sorting_log_id, ripening_allocated_weight_kg, available_weight_kg",
        )
        .in("sorting_log_id", chunk),
    ),
  );
  const failed = statusResults.find((result) => result.error);
  if (failed?.error) {
    throw new Error(`追熟割当状況の取得に失敗しました (${failed.error.code})`);
  }

  const statusById = new Map(
    statusResults.flatMap((result) => result.data ?? []).map((status) => [
      requireDbValue(
        status.sorting_log_id,
        "sorting_ripening_status.sorting_log_id",
      ),
      status,
    ]),
  );
  return rows.map((row) =>
    mapSortingRow(
      row,
      statusById.get(
        requireDbValue(row.work_record_id, "sorting_logs_expanded.work_record_id"),
      ),
    ),
  );
}

/** One complete selection record for details and label output. */
export async function getSortingLabel(
  id: string,
): Promise<SortingLabelData | null> {
  if (!sortingIdSchema.safeParse(id).success) return null;

  const supabase = await createClient();
  const [recordResult, statusResult] = await Promise.all([
    supabase
      .from("sorting_logs_expanded")
      .select(sortingListColumns)
      .eq("work_record_id", id)
      .maybeSingle(),
    supabase
      .from("sorting_ripening_status")
      .select(
        "sorting_log_id, ripening_allocated_weight_kg, available_weight_kg",
      )
      .eq("sorting_log_id", id)
      .maybeSingle(),
  ]);

  const error = recordResult.error ?? statusResult.error;
  if (error) throw new Error(`選果詳細の取得に失敗しました (${error.code})`);
  if (!recordResult.data) return null;

  return mapSortingRow(
    recordResult.data,
    statusResult.data ?? undefined,
  );
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

import type {
  HarvestDashboardData,
  HarvestFormOptions,
  HarvestLogRow,
  HarvestPeriod,
  HarvestStatus,
  Option,
  TreeBlock,
} from "@/features/harvest/schema";
import { createClient } from "@/lib/supabase/server";

/**
 * Data access for the harvest feature. Only this file (and actions.ts) may
 * talk to Supabase for harvest data; components receive plain domain objects.
 *
 * Reads use the signed-in user's Supabase session, so RLS remains authoritative.
 */

export async function getHarvestFormOptions(): Promise<HarvestFormOptions> {
  const supabase = await createClient();
  const [plotsResult, treeBlocksResult, varietiesResult] = await Promise.all([
    supabase
      .from("plots")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("tree_blocks")
      .select("id, plot_id, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("varieties")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
  ]);

  const error = plotsResult.error ?? treeBlocksResult.error ?? varietiesResult.error;
  if (error) {
    throw new Error(`収穫マスターデータの取得に失敗しました (${error.code})`);
  }

  return {
    plots: (plotsResult.data ?? []) satisfies Option[],
    treeBlocks: (treeBlocksResult.data ?? []).map(
      (row): TreeBlock => ({ id: row.id, name: row.name, plotId: row.plot_id }),
    ),
    varieties: (varietiesResult.data ?? []) satisfies Option[],
  };
}

/** The signed-in staff member, used to pre-fill 担当者. */
export async function getCurrentStaff(): Promise<Option | null> {
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

type ExpandedHarvestRow = {
  work_record_id: string;
  title: string;
  work_date: string;
  work_time: string | null;
  variety_name: string;
  plot_name: string;
  tree_block_name: string | null;
  branch: string | null;
  weight_kg: number | string;
  sorting_deadline: string;
  staff_name: string;
  notes: string | null;
};

type SortingStatusRow = {
  harvest_log_id: string;
  sorted_weight_kg: number | string;
  remaining_unsorted_kg: number | string;
};

const harvestListColumns =
  "work_record_id, title, work_date, work_time, variety_name, plot_name, tree_block_name, branch, weight_kg, sorting_deadline, staff_name, notes";

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

function periodRange(period: HarvestPeriod) {
  const today = tokyoDateString();
  const current = new Date(`${today}T00:00:00Z`);

  if (period === "today") {
    return { start: today, end: today, label: "今日" };
  }

  if (period === "week") {
    const day = current.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return {
      start: addDays(today, mondayOffset),
      end: addDays(today, 6 - (day === 0 ? 6 : day - 1)),
      label: "今週",
    };
  }

  const year = current.getUTCFullYear();
  const month = current.getUTCMonth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  return { start, end, label: "今月" };
}

function statusFor(deadline: string, remainingWeightKg: number): HarvestStatus {
  if (remainingWeightKg <= 0) return "completed";
  const today = tokyoDateString();
  if (deadline < today) return "overdue";
  if (deadline <= addDays(today, 7)) return "due-soon";
  return "pending";
}

function mapHarvestRows(
  rows: ExpandedHarvestRow[],
  statuses: SortingStatusRow[],
): HarvestLogRow[] {
  const statusByHarvest = new Map(
    statuses.map((status) => [status.harvest_log_id, status]),
  );

  return rows.map((row) => {
    const sorting = statusByHarvest.get(row.work_record_id);
    const weightKg = numberValue(row.weight_kg);
    const sortedWeightKg = numberValue(sorting?.sorted_weight_kg);
    const remainingWeightKg = sorting
      ? Math.max(0, numberValue(sorting.remaining_unsorted_kg))
      : weightKg;

    return {
      id: row.work_record_id,
      title: row.title,
      workDate: row.work_date,
      workTime: row.work_time,
      varietyName: row.variety_name,
      plotName: row.plot_name,
      treeBlockName: row.tree_block_name,
      branch: row.branch,
      weightKg,
      sortedWeightKg,
      remainingWeightKg,
      sortingDeadline: row.sorting_deadline,
      staffName: row.staff_name,
      notes: row.notes,
      status: statusFor(row.sorting_deadline, remainingWeightKg),
    };
  });
}

/** Shared harvest history for phone cards and desktop tables. */
export async function listHarvestLogs(limit = 100): Promise<HarvestLogRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("harvest_logs_expanded")
    .select(harvestListColumns)
    .order("work_date", { ascending: false })
    .order("input_ts", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`収穫履歴の取得に失敗しました (${error.code})`);

  const ids = (rows ?? []).map((row) => row.work_record_id);
  if (ids.length === 0) return [];

  // Keep PostgREST URLs comfortably below proxy limits for the 1,000-row table.
  const statusChunks = Array.from(
    { length: Math.ceil(ids.length / 150) },
    (_, index) => ids.slice(index * 150, (index + 1) * 150),
  );
  const statusResults = await Promise.all(
    statusChunks.map((chunk) =>
      supabase
        .from("harvest_sorting_status")
        .select("harvest_log_id, sorted_weight_kg, remaining_unsorted_kg")
        .in("harvest_log_id", chunk),
    ),
  );
  const failedStatus = statusResults.find((result) => result.error);
  if (failedStatus?.error) {
    throw new Error(`収穫状況の取得に失敗しました (${failedStatus.error.code})`);
  }
  const statuses = statusResults.flatMap((result) => result.data ?? []);

  return mapHarvestRows(
    (rows ?? []) as ExpandedHarvestRow[],
    (statuses ?? []) as SortingStatusRow[],
  );
}

/** Live summary used by the first, harvest-focused dashboard. */
export async function getHarvestDashboardData(
  period: HarvestPeriod,
): Promise<HarvestDashboardData> {
  const supabase = await createClient();
  const range = periodRange(period);

  const attentionDeadline = addDays(tokyoDateString(), 7);
  const [periodResult, recentResult, attentionResult] = await Promise.all([
    supabase
      .from("harvest_logs_expanded")
      .select(harvestListColumns)
      .gte("work_date", range.start)
      .lte("work_date", range.end)
      .order("work_date"),
    supabase
      .from("harvest_logs_expanded")
      .select(harvestListColumns)
      .order("work_date", { ascending: false })
      .order("input_ts", { ascending: false })
      .limit(6),
    supabase
      .from("harvest_logs_expanded")
      .select(harvestListColumns)
      .lte("sorting_deadline", attentionDeadline)
      .order("sorting_deadline")
      .limit(100),
  ]);

  const error = periodResult.error ?? recentResult.error ?? attentionResult.error;
  if (error) throw new Error(`ダッシュボードの取得に失敗しました (${error.code})`);

  const periodRows = (periodResult.data ?? []) as ExpandedHarvestRow[];
  const recentRows = (recentResult.data ?? []) as ExpandedHarvestRow[];
  const attentionRows = (attentionResult.data ?? []) as ExpandedHarvestRow[];
  const ids = [
    ...new Set(
      [...periodRows, ...recentRows, ...attentionRows].map(
        (row) => row.work_record_id,
      ),
    ),
  ];
  let statuses: SortingStatusRow[] = [];

  if (ids.length > 0) {
    const statusResult = await supabase
      .from("harvest_sorting_status")
      .select("harvest_log_id, sorted_weight_kg, remaining_unsorted_kg")
      .in("harvest_log_id", ids);
    if (statusResult.error) {
      throw new Error(`収穫状況の取得に失敗しました (${statusResult.error.code})`);
    }
    statuses = (statusResult.data ?? []) as SortingStatusRow[];
  }

  const periodLogs = mapHarvestRows(periodRows, statuses);
  const recentHarvests = mapHarvestRows(recentRows, statuses);
  const attentionLogs = mapHarvestRows(attentionRows, statuses).filter(
    (log) => log.status === "overdue" || log.status === "due-soon",
  );
  const daily = new Map<string, number>();

  for (const log of periodLogs) {
    daily.set(log.workDate, (daily.get(log.workDate) ?? 0) + log.weightKg);
  }

  return {
    period,
    periodLabel: range.label,
    totalWeightKg: periodLogs.reduce((sum, log) => sum + log.weightKg, 0),
    recordCount: periodLogs.length,
    sortedWeightKg: periodLogs.reduce((sum, log) => sum + log.sortedWeightKg, 0),
    unsortedWeightKg: periodLogs.reduce(
      (sum, log) => sum + log.remainingWeightKg,
      0,
    ),
    attentionCount: attentionLogs.length,
    dailyWeights: [...daily.entries()].map(([date, weightKg]) => ({
      label: `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`,
      weightKg,
    })),
    recentHarvests,
    nextAction: attentionLogs[0] ?? null,
  };
}

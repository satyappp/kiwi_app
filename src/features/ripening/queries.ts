import type {
  RipeningFormOptions,
  RipeningPhase,
  RipeningStatus,
  StaffOption,
} from "@/features/ripening/schema";
import { createClient } from "@/lib/supabase/server";

function toNumber(value: number | string | null) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toNullableNumber(value: number | string | null) {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toPhase(value: string): RipeningPhase {
  if (
    value === "scheduled" ||
    value === "ethylene_processing" ||
    value === "post_ethylene_processing" ||
    value === "ready_to_ship" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "scheduled";
}

/** All live database choices needed by the ripening start form. */
export async function getRipeningFormOptions(): Promise<RipeningFormOptions> {
  const supabase = await createClient();
  const [locationsResult, rulesResult, sourcesResult] = await Promise.all([
    supabase
      .from("ripening_locations")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("ripening_rules_expanded")
      .select(
        "id, variety_id, variety_name, start_month, ethylene_temperature_c, ethylene_duration_hours, resting_temperature_c, resting_duration_hours, is_schedule_configured",
      )
      .eq("is_active", true)
      .order("start_month")
      .order("variety_name"),
    supabase
      .from("sorting_ripening_status")
      .select(
        "sorting_log_id, sorting_title, harvest_title, variety_id, variety_name, plot_name, size_code, sorting_date, ethylene_start_deadline, sorted_weight_kg, ripening_allocated_weight_kg, available_weight_kg",
      )
      .gt("available_weight_kg", 0)
      .order("ethylene_start_deadline")
      .order("sorting_date"),
  ]);

  const error =
    locationsResult.error ?? rulesResult.error ?? sourcesResult.error;
  if (error) {
    throw new Error(`追熟フォームデータの取得に失敗しました (${error.code})`);
  }

  return {
    locations: (locationsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
    })),
    rules: (rulesResult.data ?? []).map((row) => ({
      id: row.id,
      varietyId: row.variety_id,
      varietyName: row.variety_name,
      startMonth: row.start_month,
      ethyleneTemperatureC: toNullableNumber(row.ethylene_temperature_c),
      ethyleneDurationHours: toNullableNumber(row.ethylene_duration_hours),
      restingTemperatureC: toNullableNumber(row.resting_temperature_c),
      restingDurationHours: toNullableNumber(row.resting_duration_hours),
      isScheduleConfigured: row.is_schedule_configured,
    })),
    sortingSources: (sourcesResult.data ?? []).map((row) => ({
      id: row.sorting_log_id,
      title: row.sorting_title,
      harvestTitle: row.harvest_title,
      varietyId: row.variety_id,
      varietyName: row.variety_name,
      plotName: row.plot_name,
      sizeCode: row.size_code,
      sortingDate: row.sorting_date,
      ethyleneStartDeadline: row.ethylene_start_deadline,
      sortedWeightKg: toNumber(row.sorted_weight_kg),
      allocatedWeightKg: toNumber(row.ripening_allocated_weight_kg),
      availableWeightKg: toNumber(row.available_weight_kg),
    })),
  };
}

/** The signed-in worker displayed in the read-only staff field. */
export async function getCurrentRipeningStaff(): Promise<StaffOption | null> {
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

/** Active batches ordered by the next action the worker must check. */
export async function listActiveRipeningStatuses(): Promise<RipeningStatus[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ripening_batches_expanded")
    .select(
      "work_record_id, ripening_no, ripening_title, ripening_location, variety_name, weight_kg, sorting_titles, ethylene_ended_at, shippable_at, phase, next_check_at, next_check_type, is_ethylene_processing, is_overdue, is_due_soon",
    )
    .is("cancelled_at", null)
    .is("completed_at", null)
    .order("next_check_at")
    .limit(12);

  if (error) {
    throw new Error(`追熟状況の取得に失敗しました (${error.code})`);
  }

  return (data ?? []).map((row) => ({
    id: row.work_record_id,
    ripeningNo: Number(row.ripening_no),
    title: row.ripening_title,
    locationName: row.ripening_location,
    varietyName: row.variety_name,
    weightKg: toNumber(row.weight_kg),
    sortingTitles: Array.isArray(row.sorting_titles) ? row.sorting_titles : [],
    ethyleneEndedAt: row.ethylene_ended_at,
    shippableAt: row.shippable_at,
    phase: toPhase(row.phase),
    nextCheckAt: row.next_check_at,
    nextCheckType:
      row.next_check_type === "ethylene_end" ||
      row.next_check_type === "shippable"
        ? row.next_check_type
        : null,
    isEthyleneProcessing: row.is_ethylene_processing,
    isOverdue: row.is_overdue,
    isDueSoon: row.is_due_soon,
  }));
}


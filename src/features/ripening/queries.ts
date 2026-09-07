import type {
  RipeningFormOptions,
  RipeningPhase,
  RipeningStatus,
  StaffOption,
} from "@/features/ripening/schema";
import { requireDbValue } from "@/lib/supabase/guards";
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
  const [locationsResult, rulesResult, recentSettingsResult, sourcesResult] =
    await Promise.all([
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
        .from("ripening_batches")
        .select(
          "variety_id, started_at, ethylene_temperature_c, ethylene_processing_hours, resting_temperature_c, resting_duration_hours",
        )
        .is("cancelled_at", null)
        .order("started_at", { ascending: false })
        .limit(200),
      supabase
        .from("sorting_ripening_status")
        .select(
          "sorting_log_id, sorting_title, harvest_title, variety_id, variety_name, plot_name, size_code, sorting_date, ethylene_start_deadline, sorted_weight_kg, ripening_allocated_weight_kg, available_weight_kg",
        )
        .gt("available_weight_kg", 0)
        .order("ethylene_start_deadline")
        .order("sorting_date")
        .order("sorting_title"),
    ]);

  const error =
    locationsResult.error ??
    rulesResult.error ??
    recentSettingsResult.error ??
    sourcesResult.error;
  if (error) {
    throw new Error(`追熟フォームデータの取得に失敗しました (${error.code})`);
  }

  const recentSettingsByVariety = new Map<
    string,
    RipeningFormOptions["recentSettings"][number]
  >();
  for (const row of recentSettingsResult.data ?? []) {
    if (recentSettingsByVariety.has(row.variety_id)) continue;
    recentSettingsByVariety.set(row.variety_id, {
      varietyId: row.variety_id,
      startedAt: row.started_at,
      ethyleneTemperatureC: toNullableNumber(row.ethylene_temperature_c),
      ethyleneDurationHours: toNumber(row.ethylene_processing_hours),
      restingTemperatureC: toNullableNumber(row.resting_temperature_c),
      restingDurationHours: toNumber(row.resting_duration_hours),
    });
  }

  return {
    locations: (locationsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
    })),
    rules: (rulesResult.data ?? []).map((row) => ({
      id: requireDbValue(row.id, "ripening_rules_expanded.id"),
      varietyId: requireDbValue(
        row.variety_id,
        "ripening_rules_expanded.variety_id",
      ),
      varietyName: requireDbValue(
        row.variety_name,
        "ripening_rules_expanded.variety_name",
      ),
      startMonth: requireDbValue(
        row.start_month,
        "ripening_rules_expanded.start_month",
      ),
      ethyleneTemperatureC: toNullableNumber(row.ethylene_temperature_c),
      ethyleneDurationHours: toNullableNumber(row.ethylene_duration_hours),
      restingTemperatureC: toNullableNumber(row.resting_temperature_c),
      restingDurationHours: toNullableNumber(row.resting_duration_hours),
      isScheduleConfigured: requireDbValue(
        row.is_schedule_configured,
        "ripening_rules_expanded.is_schedule_configured",
      ),
    })),
    recentSettings: [...recentSettingsByVariety.values()],
    sortingSources: (sourcesResult.data ?? []).map((row) => ({
      id: requireDbValue(row.sorting_log_id, "sorting_ripening_status.sorting_log_id"),
      title: requireDbValue(row.sorting_title, "sorting_ripening_status.sorting_title"),
      harvestTitle: requireDbValue(
        row.harvest_title,
        "sorting_ripening_status.harvest_title",
      ),
      varietyId: requireDbValue(row.variety_id, "sorting_ripening_status.variety_id"),
      varietyName: requireDbValue(
        row.variety_name,
        "sorting_ripening_status.variety_name",
      ),
      plotName: requireDbValue(row.plot_name, "sorting_ripening_status.plot_name"),
      sizeCode: requireDbValue(row.size_code, "sorting_ripening_status.size_code"),
      sortingDate: requireDbValue(
        row.sorting_date,
        "sorting_ripening_status.sorting_date",
      ),
      ethyleneStartDeadline: requireDbValue(
        row.ethylene_start_deadline,
        "sorting_ripening_status.ethylene_start_deadline",
      ),
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
    id: requireDbValue(row.work_record_id, "ripening_batches_expanded.work_record_id"),
    ripeningNo: Number(row.ripening_no),
    title: requireDbValue(row.ripening_title, "ripening_batches_expanded.ripening_title"),
    locationName: requireDbValue(
      row.ripening_location,
      "ripening_batches_expanded.ripening_location",
    ),
    varietyName: requireDbValue(
      row.variety_name,
      "ripening_batches_expanded.variety_name",
    ),
    weightKg: toNumber(row.weight_kg),
    sortingTitles: Array.isArray(row.sorting_titles) ? row.sorting_titles : [],
    ethyleneEndedAt: requireDbValue(
      row.ethylene_ended_at,
      "ripening_batches_expanded.ethylene_ended_at",
    ),
    shippableAt: requireDbValue(
      row.shippable_at,
      "ripening_batches_expanded.shippable_at",
    ),
    phase: toPhase(requireDbValue(row.phase, "ripening_batches_expanded.phase")),
    nextCheckAt: requireDbValue(
      row.next_check_at,
      "ripening_batches_expanded.next_check_at",
    ),
    nextCheckType:
      row.next_check_type === "ethylene_end" ||
      row.next_check_type === "shippable"
        ? row.next_check_type
        : null,
    isEthyleneProcessing: requireDbValue(
      row.is_ethylene_processing,
      "ripening_batches_expanded.is_ethylene_processing",
    ),
    isOverdue: requireDbValue(row.is_overdue, "ripening_batches_expanded.is_overdue"),
    isDueSoon: requireDbValue(row.is_due_soon, "ripening_batches_expanded.is_due_soon"),
  }));
}

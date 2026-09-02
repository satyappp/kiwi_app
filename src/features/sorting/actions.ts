"use server";

import { revalidatePath } from "next/cache";

import {
  getSortingOverageKg,
  sortingInputSchema,
} from "@/features/sorting/schema";
import { createClient } from "@/lib/supabase/server";

export type CreateSortingResult =
  | { ok: true; id: string; warning?: string }
  | { ok: false; fieldErrors: Record<string, string[]> }
  | { ok: false; formError: string };

/**
 * Application use case: record one size/weight result for a harvest.
 *
 * Authentication and current master data are checked again on the server;
 * client dropdown values are never trusted. Identity and derived fields are
 * intentionally omitted because the database sets staff_id, timestamps, and
 * ethylene_start_deadline. The worker-selected sorting_date is stored as-is.
 *
 * An overage is allowed so field work is not blocked, but the result includes
 * a warning when the new weight exceeds the remaining unsorted harvest.
 */
export async function createSorting(
  _prev: CreateSortingResult | null,
  formData: FormData,
): Promise<CreateSortingResult> {
  const parsed = sortingInputSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return {
      ok: false,
      formError: "ログイン状態を確認できません。ログインし直してください。",
    };
  }

  const input = parsed.data;
  // Validate both references against rows visible to the signed-in user.
  const [harvestStatusResult, sizeStandardResult] = await Promise.all([
    supabase
      .from("harvest_sorting_status")
      .select("remaining_unsorted_kg")
      .eq("harvest_log_id", input.harvestLogId)
      .maybeSingle(),
    supabase
      .from("size_standards")
      .select("id")
      .eq("id", input.sizeStandardId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (harvestStatusResult.error || !harvestStatusResult.data) {
    return {
      ok: false,
      formError: "選択した収穫を確認できませんでした。もう一度選択してください。",
    };
  }

  if (sizeStandardResult.error || !sizeStandardResult.data) {
    return {
      ok: false,
      fieldErrors: { sizeStandardId: ["有効なサイズを選択してください"] },
    };
  }

  const remainingWeightKg = Number(
    harvestStatusResult.data.remaining_unsorted_kg,
  );
  if (!Number.isFinite(remainingWeightKg)) {
    return {
      ok: false,
      formError: "選択した収穫の残量を確認できませんでした。",
    };
  }

  const overageKg = getSortingOverageKg(input.weightKg, remainingWeightKg);
  // The trigger fills staff and derives the ethylene deadline from sorting_date.
  const { data, error } = await supabase
    .from("sorting_logs")
    .insert({
      harvest_log_id: input.harvestLogId,
      size_standard_id: input.sizeStandardId,
      sorting_date: input.sortingDate,
      weight_kg: input.weightKg,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createSorting failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      ok: false,
      formError: "選果を登録できませんでした。入力内容を確認してもう一度お試しください。",
    };
  }

  // Refresh every surface that may show sorting totals or current tasks.
  revalidatePath("/");
  revalidatePath("/sorting/new");
  revalidatePath("/dashboard");

  return {
    ok: true,
    id: data.id,
    ...(overageKg > 0
      ? { warning: `収穫量を${overageKg.toLocaleString("ja-JP")} kg超えて登録されました。` }
      : {}),
  };
}

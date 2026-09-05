"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ripeningInputSchema,
  type RipeningInput,
} from "@/features/ripening/schema";
import { createClient } from "@/lib/supabase/server";

export type StartRipeningResult =
  | {
      ok: true;
      id: string;
      title: string;
      ethyleneEndedAt: string;
      shippableAt: string;
    }
  | { ok: false; fieldErrors: Record<string, string[]> }
  | { ok: false; formError: string };

const batchIdSchema = z.string().uuid();

function inputFromFormData(formData: FormData) {
  const sortingLogIds = formData.getAll("sortingLogId");
  const weights = formData.getAll("itemWeightKg");

  return {
    startDate: formData.get("startDate"),
    startTime: formData.get("startTime"),
    locationId: formData.get("locationId"),
    newLocationName: formData.get("newLocationName"),
    ethyleneTemperatureC: formData.get("ethyleneTemperatureC"),
    ethyleneProcessingHours: formData.get("ethyleneProcessingHours"),
    restingTemperatureC: formData.get("restingTemperatureC"),
    restingDurationHours: formData.get("restingDurationHours"),
    notificationsEnabled: formData.get("notificationsEnabled") === "on",
    notes: formData.get("notes"),
    items: sortingLogIds.map((sortingLogId, index) => ({
      sortingLogId,
      weightKg: weights[index],
    })),
  };
}

async function resolveLocationId(
  input: RipeningInput,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  if (input.locationId) {
    const { data, error } = await supabase
      .from("ripening_locations")
      .select("id")
      .eq("id", input.locationId)
      .eq("is_active", true)
      .maybeSingle();
    return error || !data ? null : data.id;
  }

  const { data, error } = await supabase
    .from("ripening_locations")
    .insert({ name: input.newLocationName! })
    .select("id")
    .single();
  return error || !data ? null : data.id;
}

/** Creates one ripening batch and its sorting-log breakdown. */
export async function startRipening(
  _previousState: StartRipeningResult | null,
  formData: FormData,
): Promise<StartRipeningResult> {
  const parsed = ripeningInputSchema.safeParse(inputFromFormData(formData));

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
  const sourceIds = input.items.map((item) => item.sortingLogId);
  const { data: sources, error: sourcesError } = await supabase
    .from("sorting_ripening_status")
    .select("sorting_log_id, variety_id, available_weight_kg")
    .in("sorting_log_id", sourceIds);

  if (sourcesError || !sources || sources.length !== sourceIds.length) {
    return {
      ok: false,
      formError: "選択した選果データを確認できません。もう一度選択してください。",
    };
  }

  const sourceById = new Map(sources.map((source) => [source.sorting_log_id, source]));
  const varietyIds = new Set(sources.map((source) => source.variety_id));
  if (varietyIds.size !== 1) {
    return {
      ok: false,
      formError: "1つの追熟には同じ品種の選果データだけを選択してください。",
    };
  }

  for (const item of input.items) {
    const availableWeightKg = Number(
      sourceById.get(item.sortingLogId)?.available_weight_kg,
    );
    if (!Number.isFinite(availableWeightKg) || item.weightKg > availableWeightKg) {
      return {
        ok: false,
        formError: "入力した量が最新の選果残量を超えています。量を確認してください。",
      };
    }
  }

  const locationId = await resolveLocationId(input, supabase);
  if (!locationId) {
    return {
      ok: false,
      fieldErrors: {
        locationId: ["追熟場所を確認できません。別の場所を選択してください"],
      },
    };
  }

  const startedAt = `${input.startDate}T${input.startTime}:00+09:00`;
  const varietyId = sources[0].variety_id;
  const { data: batch, error: batchError } = await supabase
    .from("ripening_batches")
    .insert({
      variety_id: varietyId,
      location_id: locationId,
      started_at: startedAt,
      ethylene_temperature_c: input.ethyleneTemperatureC ?? null,
      ethylene_processing_hours: input.ethyleneProcessingHours,
      resting_temperature_c: input.restingTemperatureC ?? null,
      resting_duration_hours: input.restingDurationHours,
      notifications_enabled: input.notificationsEnabled,
      notes: input.notes ?? null,
    })
    .select("id, title, ethylene_ended_at, shippable_at")
    .single();

  if (batchError || !batch) {
    console.error("startRipening batch insert failed", {
      code: batchError?.code,
      message: batchError?.message,
    });
    return {
      ok: false,
      formError: "追熟を登録できませんでした。条件を確認してもう一度お試しください。",
    };
  }

  const { error: itemsError } = await supabase
    .from("ripening_batch_items")
    .insert(
      input.items.map((item) => ({
        ripening_batch_id: batch.id,
        sorting_log_id: item.sortingLogId,
        weight_kg: item.weightKg,
      })),
    );

  if (itemsError) {
    // Keep the audit row, but immediately release any successful allocations.
    await supabase
      .from("ripening_batches")
      .update({ cancelled_at: new Date().toISOString() })
      .eq("id", batch.id);
    console.error("startRipening item insert failed", {
      code: itemsError.code,
      message: itemsError.message,
    });
    return {
      ok: false,
      formError: itemsError.message.includes("exceeds sorting weight")
        ? "ほかの登録で選果残量が変わりました。最新の量を確認してください。"
        : "追熟の内訳を登録できませんでした。もう一度お試しください。",
    };
  }

  revalidatePath("/");
  revalidatePath("/ripening/new");
  revalidatePath("/dashboard");

  return {
    ok: true,
    id: batch.id,
    title: batch.title,
    ethyleneEndedAt: batch.ethylene_ended_at,
    shippableAt: batch.shippable_at,
  };
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return error || !data?.claims?.sub ? null : supabase;
}

/** Records that the worker removed ethylene after the scheduled check. */
export async function confirmEthyleneRemoval(formData: FormData) {
  const parsedId = batchIdSchema.safeParse(formData.get("batchId"));
  if (!parsedId.success) return;

  const supabase = await getAuthenticatedClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("ripening_batches")
    .update({ ethylene_removed_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .is("ethylene_removed_at", null)
    .is("completed_at", null)
    .is("cancelled_at", null);

  if (error) {
    console.error("confirmEthyleneRemoval failed", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  revalidatePath("/");
  revalidatePath("/ripening/new");
  revalidatePath("/dashboard");
}

/** Marks a shippable batch's ripening checks as complete. */
export async function completeRipening(formData: FormData) {
  const parsedId = batchIdSchema.safeParse(formData.get("batchId"));
  if (!parsedId.success) return;

  const supabase = await getAuthenticatedClient();
  if (!supabase) return;

  const { data: batch, error: readError } = await supabase
    .from("ripening_batches")
    .select("shippable_at, ethylene_removed_at")
    .eq("id", parsedId.data)
    .is("completed_at", null)
    .is("cancelled_at", null)
    .maybeSingle();

  if (
    readError ||
    !batch?.ethylene_removed_at ||
    new Date(batch.shippable_at).getTime() > Date.now()
  ) {
    return;
  }

  const { error } = await supabase
    .from("ripening_batches")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .is("completed_at", null)
    .is("cancelled_at", null);

  if (error) {
    console.error("completeRipening failed", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  revalidatePath("/");
  revalidatePath("/ripening/new");
  revalidatePath("/dashboard");
}

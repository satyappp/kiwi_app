"use server";

import { revalidatePath } from "next/cache";

import { harvestInputSchema } from "@/features/harvest/schema";
import { createClient } from "@/lib/supabase/server";

export type CreateHarvestResult =
  | { ok: true; id: string }
  | { ok: false; fieldErrors: Record<string, string[]> }
  | { ok: false; formError: string };

/**
 * Application use case: record a harvest entry.
 *
 * Identity and derived fields are intentionally omitted: the database sets
 * staff_id, timestamps, title, year/month, and blank-time defaults.
 */
export async function createHarvest(
  _prev: CreateHarvestResult | null,
  formData: FormData,
): Promise<CreateHarvestResult> {
  const parsed = harvestInputSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const input = parsed.data;
  const row = {
    work_date: input.workDate,
    plot_id: input.plotId,
    tree_block_id: input.treeBlockId ?? null,
    variety_id: input.varietyId,
    branch: input.branch ?? null,
    sorting_deadline: input.sortingDeadline,
    weight_kg: input.weightKg,
    notes: input.notes ?? null,
    ...(input.workTime ? { work_time: input.workTime } : {}),
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("harvest_logs")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    console.error("createHarvest failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      ok: false,
      formError: "収穫を登録できませんでした。入力内容を確認してもう一度お試しください。",
    };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");

  return { ok: true, id: data.id };
}

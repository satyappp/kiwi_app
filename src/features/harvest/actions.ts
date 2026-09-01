"use server";

import { harvestInputSchema } from "@/features/harvest/schema";

export type CreateHarvestResult =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string[]> }
  | { ok: false; formError: string };

/**
 * Application use case: record a harvest entry.
 *
 * TODO(supabase): insert into `harvest_logs` and revalidate the home /
 * dashboard paths once the schema exists. For now this only validates so the
 * form wiring and error surface can be built against a stable contract.
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

  // const supabase = await createClient();
  // await supabase.from("harvest_logs").insert(mapToRow(parsed.data));
  // revalidatePath("/");

  return { ok: true };
}

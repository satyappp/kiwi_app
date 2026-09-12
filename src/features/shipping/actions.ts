"use server";

import { revalidatePath } from "next/cache";
import { shippingSaleInputSchema } from "@/features/shipping/schema";
import { createClient } from "@/lib/supabase/server";

export type CreateShippingSaleResult =
  | { ok: true; id: string }
  | { ok: false; fieldErrors: Record<string, string[]> }
  | { ok: false; formError: string };

export async function createShippingSale(
  _previous: CreateShippingSaleResult | null,
  formData: FormData,
): Promise<CreateShippingSaleResult> {
  const parsed = shippingSaleInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  const input = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_shipping_sale", {
    p_business_partner_id: input.businessPartnerId,
    p_variety_id: input.varietyId,
    p_size_standard_id: input.sizeStandardId,
    p_delivery_package_id: input.deliveryPackageId,
    p_quantity_kg: input.quantityKg,
    p_unit_price_yen_per_kg: input.unitPriceYenPerKg,
    p_delivery_date: input.deliveryDate,
    p_shipping_date: input.shippingDate,
    p_notes: input.notes,
  });
  if (error || !data) {
    console.error("createShippingSale failed", { code: error?.code, message: error?.message });
    const inventoryError = error?.message.includes("Insufficient");
    return { ok: false, formError: inventoryError
      ? "在庫が不足しています。最新の在庫量を確認してください。"
      : "出荷・販売を登録できませんでした。入力内容を確認してください。" };
  }
  revalidatePath("/inventory");
  revalidatePath("/shipping/new");
  revalidatePath("/dashboard");
  return { ok: true, id: data };
}

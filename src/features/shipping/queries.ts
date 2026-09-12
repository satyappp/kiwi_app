import type { ShippingFormOptions } from "@/features/shipping/schema";
import { requireDbValue } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";

const toNumber = (value: number | string | null) => Number(value ?? 0);

export async function getShippingFormOptions(): Promise<ShippingFormOptions> {
  const supabase = await createClient();
  const [partners, inventory, packages] = await Promise.all([
    supabase.from("business_partners").select("id, short_name").eq("is_active", true).order("short_name"),
    supabase.from("shipping_available_inventory").select("variety_id, variety_name, size_standard_id, size_code, available_weight_kg").gt("available_weight_kg", 0).order("variety_name").order("size_code"),
    supabase.from("delivery_packages").select("id, variety_id, size_standard_id, package_name, package_format, unit_price_yen_per_kg").eq("is_active", true).order("package_name"),
  ]);
  const error = partners.error ?? inventory.error ?? packages.error;
  if (error) throw new Error(`出荷フォームデータの取得に失敗しました (${error.code})`);

  return {
    partners: (partners.data ?? []).map((row) => ({ id: row.id, name: row.short_name })),
    inventory: (inventory.data ?? []).map((row) => ({
      varietyId: requireDbValue(row.variety_id, "shipping_available_inventory.variety_id"),
      varietyName: requireDbValue(row.variety_name, "shipping_available_inventory.variety_name"),
      sizeStandardId: requireDbValue(row.size_standard_id, "shipping_available_inventory.size_standard_id"),
      sizeCode: requireDbValue(row.size_code, "shipping_available_inventory.size_code"),
      availableWeightKg: toNumber(row.available_weight_kg),
    })),
    packages: (packages.data ?? []).flatMap((row) =>
      row.variety_id && row.size_standard_id && row.package_name ? [{
        id: row.id, varietyId: row.variety_id, sizeStandardId: row.size_standard_id,
        name: row.package_name, format: row.package_format,
        unitPriceYenPerKg: row.unit_price_yen_per_kg === null ? null : toNumber(row.unit_price_yen_per_kg),
      }] : []),
  };
}

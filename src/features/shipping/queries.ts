import type {
  ShippingFormOptions,
  ShippingSaleRow,
  ShippingSaleStatus,
} from "@/features/shipping/schema";
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

function todayInJst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shippingStatus(
  shippingDate: string,
  cancelledAt: string | null,
): ShippingSaleStatus {
  if (cancelledAt) return "cancelled";
  return shippingDate > todayInJst() ? "reserved" : "shipped";
}

/** Shipping and sales records shown on the management dashboard. */
export async function listShippingSales(limit = 1000): Promise<ShippingSaleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_sales")
    .select(`
      id, quantity_kg, unit_price_yen_per_kg, shipping_date, delivery_date,
      notes, cancelled_at, created_at,
      partner:business_partners!shipping_sales_business_partner_id_fkey(short_name),
      variety:varieties!shipping_sales_variety_id_fkey(name),
      size:size_standards!shipping_sales_size_standard_id_fkey(code),
      package:delivery_packages!shipping_sales_delivery_package_id_fkey(package_name, package_format),
      staff:profiles!shipping_sales_created_by_fkey(display_name)
    `)
    .order("shipping_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`出荷データの取得に失敗しました (${error.code})`);
  }

  return (data ?? []).map((row) => {
    const quantityKg = toNumber(row.quantity_kg);
    const unitPriceYenPerKg = toNumber(row.unit_price_yen_per_kg);
    return {
      id: row.id,
      partnerName: requireDbValue(row.partner?.short_name, "shipping_sales.partner.short_name"),
      varietyName: requireDbValue(row.variety?.name, "shipping_sales.variety.name"),
      sizeCode: requireDbValue(row.size?.code, "shipping_sales.size.code"),
      packageName: row.package?.package_format ?? row.package?.package_name ?? null,
      quantityKg,
      unitPriceYenPerKg,
      totalPriceYen: Math.round(quantityKg * unitPriceYenPerKg),
      shippingDate: row.shipping_date,
      deliveryDate: row.delivery_date,
      notes: row.notes,
      createdAt: row.created_at,
      staffName: requireDbValue(row.staff?.display_name, "shipping_sales.staff.display_name"),
      status: shippingStatus(row.shipping_date, row.cancelled_at),
    };
  });
}

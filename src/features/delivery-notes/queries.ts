import { z } from "zod";

import {
  calculateDeliveryNoteAmounts,
  deliveryNoteNumber,
} from "@/features/delivery-notes/format";
import type { DeliveryNoteData } from "@/features/delivery-notes/schema";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const deliveryNoteColumns = `
  id,
  business_partner_id,
  created_at,
  cancelled_at,
  delivery_date,
  shipping_date,
  quantity_kg,
  unit_price_yen_per_kg,
  notes,
  business_partners!inner(name, short_name, postal_code, address),
  varieties!inner(name),
  size_standards!inner(code, display_name),
  delivery_packages(package_name, package_format),
  profiles!inner(display_name)
`;

type ShippingSaleRow = Pick<
  Database["public"]["Tables"]["shipping_sales"]["Row"],
  | "id"
  | "business_partner_id"
  | "created_at"
  | "cancelled_at"
  | "delivery_date"
  | "shipping_date"
  | "quantity_kg"
  | "unit_price_yen_per_kg"
  | "notes"
> & {
  business_partners: Pick<
    Database["public"]["Tables"]["business_partners"]["Row"],
    "name" | "short_name" | "postal_code" | "address"
  >;
  varieties: Pick<
    Database["public"]["Tables"]["varieties"]["Row"],
    "name"
  >;
  size_standards: Pick<
    Database["public"]["Tables"]["size_standards"]["Row"],
    "code" | "display_name"
  >;
  delivery_packages: Pick<
    Database["public"]["Tables"]["delivery_packages"]["Row"],
    "package_name" | "package_format"
  > | null;
  profiles: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "display_name"
  >;
};

function toNumber(value: number | string | null) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function mapDeliveryNote(row: ShippingSaleRow): DeliveryNoteData {
  const quantityKg = toNumber(row.quantity_kg);
  const unitPriceYenPerKg = toNumber(row.unit_price_yen_per_kg);
  return {
    id: row.id,
    businessPartnerId: row.business_partner_id,
    documentNumber: deliveryNoteNumber(row.delivery_date, row.id),
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    deliveryDate: row.delivery_date,
    shippingDate: row.shipping_date,
    recipientName: row.business_partners.name,
    recipientShortName: row.business_partners.short_name,
    recipientPostalCode: row.business_partners.postal_code,
    recipientAddress: row.business_partners.address,
    varietyName: row.varieties.name,
    sizeCode: row.size_standards.code,
    sizeName: row.size_standards.display_name,
    packageName: row.delivery_packages?.package_name ?? null,
    packageFormat: row.delivery_packages?.package_format ?? null,
    quantityKg,
    unitPriceYenPerKg,
    ...calculateDeliveryNoteAmounts(quantityKg, unitPriceYenPerKg),
    notes: row.notes,
    staffName: row.profiles.display_name,
  };
}

export async function listDeliveryNotes(
  limit = 1000,
): Promise<DeliveryNoteData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_sales")
    .select(deliveryNoteColumns)
    .order("delivery_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`納品書データの取得に失敗しました (${error.code})`);

  return (data ?? []).map(mapDeliveryNote);
}

export async function getDeliveryNote(
  id: string,
): Promise<DeliveryNoteData | null> {
  if (!idSchema.safeParse(id).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipping_sales")
    .select(deliveryNoteColumns)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`納品書データの取得に失敗しました (${error.code})`);
  return data ? mapDeliveryNote(data) : null;
}

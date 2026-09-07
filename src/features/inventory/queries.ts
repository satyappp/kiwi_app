import {
  inventoryStatuses,
  type InventoryOverview,
  type InventoryStatus,
} from "@/features/inventory/schema";
import { requireDbValue } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";

function isInventoryStatus(value: string | null): value is InventoryStatus {
  return inventoryStatuses.some((status) => status === value);
}

function numberValue(value: number | string | null) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

/** Live inventory derived from sorting, ripening, reservation, and shipment records. */
export async function getInventoryOverview(): Promise<InventoryOverview> {
  const supabase = await createClient();
  const [varietiesResult, inventoryResult] = await Promise.all([
    supabase
      .from("varieties")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("inventory_status")
      .select(
        "status, source_id, title, variety_id, variety_name, plot_name, size_name, location_name, occurred_at, weight_kg, deadline_at, customer_name",
      )
      .order("occurred_at", { ascending: false }),
  ]);

  const error = varietiesResult.error ?? inventoryResult.error;
  if (error) {
    throw new Error(`在庫データの取得に失敗しました (${error.code})`);
  }

  return {
    varieties: (varietiesResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
    })),
    rows: (inventoryResult.data ?? []).flatMap((row) => {
      if (!isInventoryStatus(row.status)) return [];
      return [{
        status: row.status,
        sourceId: requireDbValue(row.source_id, "inventory_status.source_id"),
        title: requireDbValue(row.title, "inventory_status.title"),
        varietyId: requireDbValue(row.variety_id, "inventory_status.variety_id"),
        varietyName: requireDbValue(
          row.variety_name,
          "inventory_status.variety_name",
        ),
        plotName: row.plot_name,
        sizeName: row.size_name,
        locationName: row.location_name,
        occurredAt: requireDbValue(row.occurred_at, "inventory_status.occurred_at"),
        weightKg: numberValue(row.weight_kg),
        deadlineAt: row.deadline_at,
        customerName: row.customer_name,
      }];
    }),
  };
}

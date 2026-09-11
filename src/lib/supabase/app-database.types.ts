import type { Database } from "@/lib/supabase/database.types";

type HarvestLogs = Database["public"]["Tables"]["harvest_logs"];
type RipeningBatches = Database["public"]["Tables"]["ripening_batches"];
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type InventoryStatusRow = {
  status: string | null;
  source_id: string | null;
  title: string | null;
  variety_id: string | null;
  variety_name: string | null;
  plot_name: string | null;
  size_name: string | null;
  location_name: string | null;
  occurred_at: string | null;
  weight_kg: number | null;
  deadline_at: string | null;
  customer_name: string | null;
};

type DeliveryPackagesTable = {
  Row: {
    id: string; legacy_id: string; source_sorting_title: string;
    package_name: string | null; package_format: string | null;
    unit_price_yen_per_kg: number | null; notes: string | null;
    variety_id: string | null; size_standard_id: string | null;
    is_active: boolean; created_at: string; updated_at: string;
  };
  Insert: Record<string, never>;
  Update: Record<string, never>;
  Relationships: [];
};

type ShippingAvailableInventoryRow = {
  variety_id: string | null; variety_name: string | null;
  size_standard_id: string | null; size_code: string | null;
  available_weight_kg: number | null;
};

/**
 * Supabase introspection cannot see values filled by BEFORE INSERT triggers.
 * Keep the generated file untouched and describe only those trigger-provided
 * insert defaults here.
 */
export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Views" | "Functions"> & {
    Tables: Omit<
      Database["public"]["Tables"],
      "harvest_logs" | "ripening_batches"
    > & {
      harvest_logs: Omit<HarvestLogs, "Insert"> & {
        Insert: Omit<HarvestLogs["Insert"], "title"> & { title?: string };
      };
      ripening_batches: Omit<RipeningBatches, "Insert"> & {
        Insert: WithOptional<
          RipeningBatches["Insert"],
          | "ethylene_ended_at"
          | "ethylene_started_at"
          | "resting_started_at"
          | "shippable_at"
          | "title"
        >;
      };
      /** Temporary overlay until DB types are regenerated after migration. */
      delivery_packages: DeliveryPackagesTable;
    };
    Views: Database["public"]["Views"] & {
      /** Temporary overlay until `npm run db:types` is run after migration. */
      inventory_status: {
        Row: InventoryStatusRow;
        Relationships: [];
      };
      shipping_available_inventory: {
        Row: ShippingAvailableInventoryRow;
        Relationships: [];
      };
    };
    Functions: Database["public"]["Functions"] & {
      create_shipping_sale: {
        Args: {
          p_business_partner_id: string;
          p_variety_id: string;
          p_size_standard_id: string;
          p_delivery_package_id: string | null;
          p_quantity_kg: number;
          p_unit_price_yen_per_kg: number;
          p_delivery_date: string;
          p_shipping_date: string;
          p_notes?: string | null;
        };
        Returns: string;
      };
    };
  };
};

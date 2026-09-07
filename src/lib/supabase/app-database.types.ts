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

/**
 * Supabase introspection cannot see values filled by BEFORE INSERT triggers.
 * Keep the generated file untouched and describe only those trigger-provided
 * insert defaults here.
 */
export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Views"> & {
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
    };
    Views: Database["public"]["Views"] & {
      /** Temporary overlay until `npm run db:types` is run after migration. */
      inventory_status: {
        Row: InventoryStatusRow;
        Relationships: [];
      };
    };
  };
};

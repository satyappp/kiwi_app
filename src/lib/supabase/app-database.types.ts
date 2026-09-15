import type { Database } from "@/lib/supabase/database.types";

type HarvestLogs = Database["public"]["Tables"]["harvest_logs"];
type RipeningBatches = Database["public"]["Tables"]["ripening_batches"];
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Supabase introspection cannot see values filled by BEFORE INSERT triggers.
 * Keep the generated file untouched and describe only those trigger-provided
 * insert defaults here.
 */
export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
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
    Functions: Omit<Database["public"]["Functions"], "create_shipping_sale"> & {
      /** PostgreSQL accepts NULL for the optional package and notes inputs. */
      create_shipping_sale: {
        Args: Omit<
          Database["public"]["Functions"]["create_shipping_sale"]["Args"],
          "p_delivery_package_id" | "p_notes"
        > & {
          p_delivery_package_id: string | null;
          p_notes?: string | null;
        };
        Returns: string;
      };
    };
  };
};

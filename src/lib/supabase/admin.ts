import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { AppDatabase } from "@/lib/supabase/app-database.types";

/** Server-only client for trusted Auth administration. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase admin environment variables are not configured");
  }

  return createClient<AppDatabase>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

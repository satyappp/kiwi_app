import { createBrowserClient } from "@supabase/ssr";

import type { AppDatabase } from "@/lib/supabase/app-database.types";

export function createClient() {
  return createBrowserClient<AppDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

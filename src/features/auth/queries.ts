import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentStaff = {
  id: string;
  name: string;
};

/**
 * Request-memoized identity/profile lookup shared by layouts and pages.
 * RLS remains the authorization boundary for every subsequent data query.
 */
export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  return {
    id: userId,
    name: profile?.display_name ?? "スタッフ",
  };
});

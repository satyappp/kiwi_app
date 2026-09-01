import type {
  HarvestFormOptions,
  Option,
  TreeBlock,
} from "@/features/harvest/schema";
import { createClient } from "@/lib/supabase/server";

/**
 * Data access for the harvest feature. Only this file (and actions.ts) may
 * talk to Supabase for harvest data; components receive plain domain objects.
 *
 * Reads use the signed-in user's Supabase session, so RLS remains authoritative.
 */

export async function getHarvestFormOptions(): Promise<HarvestFormOptions> {
  const supabase = await createClient();
  const [plotsResult, treeBlocksResult, varietiesResult] = await Promise.all([
    supabase
      .from("plots")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("tree_blocks")
      .select("id, plot_id, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("varieties")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
  ]);

  const error = plotsResult.error ?? treeBlocksResult.error ?? varietiesResult.error;
  if (error) {
    throw new Error(`収穫マスターデータの取得に失敗しました (${error.code})`);
  }

  return {
    plots: (plotsResult.data ?? []) satisfies Option[],
    treeBlocks: (treeBlocksResult.data ?? []).map(
      (row): TreeBlock => ({ id: row.id, name: row.name, plotId: row.plot_id }),
    ),
    varieties: (varietiesResult.data ?? []) satisfies Option[],
  };
}

/** The signed-in staff member, used to pre-fill 担当者. */
export async function getCurrentStaff(): Promise<Option | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return { id: data.id, name: data.display_name };
}

import type {
  HarvestFormOptions,
  Option,
  TreeBlock,
} from "@/features/harvest/schema";

/**
 * Data access for the harvest feature. Only this file (and actions.ts) may
 * talk to Supabase for harvest data; components receive plain domain objects.
 *
 * TODO(supabase): everything here is placeholder data so the UI works. Swap
 * for the master-data tables (番地 / 樹体 / 品種 / スタッフ) + the signed-in
 * user later. IDs below mirror the real export sample.
 */

const PLACEHOLDER_PLOTS: Option[] = [
  { id: "73eabf6a", name: "おおくまキウイ再生クラブ第一圃場_0" },
  { id: "plot-b", name: "第二圃場" },
];

const PLACEHOLDER_TREE_BLOCKS: TreeBlock[] = [
  { id: "tb-204", plotId: "73eabf6a", name: "204" },
  { id: "tb-206", plotId: "73eabf6a", name: "206" },
  { id: "tb-208", plotId: "73eabf6a", name: "208" },
  { id: "tb-b-01", plotId: "plot-b", name: "B-01" },
];

const PLACEHOLDER_VARIETIES: Option[] = [
  { id: "be188951", name: "紅妃" },
  { id: "hayward", name: "ヘイワード" },
  { id: "sangolden", name: "サンゴールド" },
];

const PLACEHOLDER_STAFF: Option[] = [
  { id: "1", name: "原口" },
  { id: "2", name: "伊藤" },
  { id: "3", name: "山田 太郎" },
];

export async function getHarvestFormOptions(): Promise<HarvestFormOptions> {
  return {
    plots: PLACEHOLDER_PLOTS,
    treeBlocks: PLACEHOLDER_TREE_BLOCKS,
    varieties: PLACEHOLDER_VARIETIES,
    staff: PLACEHOLDER_STAFF,
  };
}

/** The signed-in staff member, used to pre-fill 担当者. */
export async function getCurrentStaff(): Promise<Option | null> {
  // TODO(auth): derive from the Supabase session.
  return PLACEHOLDER_STAFF[0];
}

import { z } from "zod";

/** 枝の向き (tree-row direction). */
export const BRANCH_OPTIONS = ["北", "南", "東", "西"] as const;
export type Branch = (typeof BRANCH_OPTIONS)[number];

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

/**
 * Domain schema for a single harvest entry (収穫登録).
 *
 * Only the fields a person actually types are here. Everything else on the
 * record is derived server-side and never entered by hand:
 *   - 作業記録ID / 入力TS            → generated on insert
 *   - スタッフID・スタッフ名          → from the signed-in user
 *   - 収穫タイトル                    → `${作業日}収穫${品種名}${番地名}${樹体名}`
 *   - 収穫年・収穫月                  → from 作業日
 *
 * Single source of truth: the client form (RHF resolver) and the server
 * action both validate against this. Types are derived, never hand-written.
 */
export const harvestInputSchema = z.object({
  workDate: z.string().min(1, "作業日を入力してください"), // 作業日
  workTime: optionalString, // 作業時間（任意、空欄ならDB既定値）
  plotId: z.string().min(1, "番地を選択してください"), // 番地
  treeBlockId: optionalString, // 樹体（任意）
  varietyId: z.string().min(1, "品種を選択してください"), // 品種
  branch: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(BRANCH_OPTIONS).optional(),
  ), // 枝（任意）
  sortingDeadline: z.string().min(1, "選果期限を入力してください"), // 選果期限
  weightKg: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce // 収穫量(kg)
      .number({ message: "収穫量を入力してください" })
      .nonnegative("0 以上の値を入力してください"),
  ),
  notes: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().max(500, "メモは500文字以内で入力してください").optional(),
  ),
});

export type HarvestInput = z.infer<typeof harvestInputSchema>;

export type Option = {
  id: string;
  name: string;
};

/** 樹体 (tree block) belongs to one 番地 (plot). */
export type TreeBlock = Option & {
  plotId: string;
};

export type HarvestFormOptions = {
  plots: Option[];
  treeBlocks: TreeBlock[];
  varieties: Option[];
};

export type HarvestPeriod = "today" | "week" | "month";

export type HarvestStatus = "completed" | "overdue" | "due-soon" | "pending";

export type HarvestLogRow = {
  id: string;
  title: string;
  workDate: string;
  workTime: string | null;
  varietyName: string;
  plotName: string;
  treeBlockName: string | null;
  branch: string | null;
  weightKg: number;
  sortedWeightKg: number;
  remainingWeightKg: number;
  sortingDeadline: string;
  staffName: string;
  notes: string | null;
  status: HarvestStatus;
};

/** Complete database-backed data printed on one harvest container label. */
export type HarvestLabelData = {
  id: string;
  title: string;
  inputTs: string;
  workDate: string;
  workTime: string | null;
  staffName: string;
  plotName: string;
  treeBlockName: string | null;
  varietyName: string;
  branch: string | null;
  sortingDeadline: string;
  weightKg: number;
  notes: string | null;
};

export type HarvestChartPoint = {
  label: string;
  weightKg: number;
};

export type HarvestAnalyticsEntry = {
  month: string;
  varietyName: string;
  weightKg: number;
  recordCount: number;
};

export type HarvestDashboardData = {
  period: HarvestPeriod;
  periodLabel: string;
  totalWeightKg: number;
  recordCount: number;
  sortedWeightKg: number;
  unsortedWeightKg: number;
  attentionCount: number;
  dailyWeights: HarvestChartPoint[];
  recentHarvests: HarvestLogRow[];
  nextActions: HarvestLogRow[];
};

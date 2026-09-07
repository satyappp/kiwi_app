import { z } from "zod";

const optionalNumber = (message: string, min: number, max?: number) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce
      .number({ message })
      .min(min, message)
      .max(max ?? Number.MAX_SAFE_INTEGER, message)
      .optional(),
  );

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

export const ripeningItemInputSchema = z.object({
  sortingLogId: z.string().min(1, "選果データを選択してください"),
  weightKg: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number({ message: "量を入力してください" })
      .positive("0より大きい量を入力してください"),
  ),
});

/** Values selected or entered when a worker starts one ripening batch. */
export const ripeningInputSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "開始日を入力してください"),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "開始時刻を入力してください"),
    locationId: optionalText,
    newLocationName: optionalText.pipe(
      z.string().max(80, "追熟場所は80文字以内で入力してください").optional(),
    ),
    ethyleneTemperatureC: optionalNumber(
      "エチレン温度を正しい数値で入力してください",
      -20,
      60,
    ),
    ethyleneProcessingHours: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce
        .number({ message: "エチレン処理時間を入力してください" })
        .positive("0より大きい時間を入力してください"),
    ),
    restingTemperatureC: optionalNumber(
      "寝かせ温度を正しい数値で入力してください",
      -20,
      60,
    ),
    restingDurationHours: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce
        .number({ message: "寝かせ時間を入力してください" })
        .min(0, "0以上の時間を入力してください"),
    ),
    notificationsEnabled: z.boolean(),
    notes: optionalText.pipe(
      z.string().max(500, "メモは500文字以内で入力してください").optional(),
    ),
    items: z
      .array(ripeningItemInputSchema)
      .min(1, "選果データを1件以上選択してください"),
  })
  .superRefine((input, context) => {
    if (!input.locationId && !input.newLocationName) {
      context.addIssue({
        code: "custom",
        message: "追熟場所を選択または入力してください",
        path: ["locationId"],
      });
    }

    const ids = input.items.map((item) => item.sortingLogId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "同じ選果データが重複しています",
        path: ["items"],
      });
    }
  });

export type RipeningInput = z.infer<typeof ripeningInputSchema>;

export type StaffOption = {
  id: string;
  name: string;
};

export type RipeningLocationOption = {
  id: string;
  name: string;
};

export type RipeningRuleOption = {
  id: string;
  varietyId: string;
  varietyName: string;
  startMonth: number;
  ethyleneTemperatureC: number | null;
  ethyleneDurationHours: number | null;
  restingTemperatureC: number | null;
  restingDurationHours: number | null;
  isScheduleConfigured: boolean;
};

export type SortingRipeningOption = {
  id: string;
  title: string;
  harvestTitle: string;
  varietyId: string;
  varietyName: string;
  plotName: string;
  sizeCode: string;
  sortingDate: string;
  ethyleneStartDeadline: string;
  sortedWeightKg: number;
  allocatedWeightKg: number;
  availableWeightKg: number;
};

export type RipeningFormOptions = {
  locations: RipeningLocationOption[];
  rules: RipeningRuleOption[];
  sortingSources: SortingRipeningOption[];
};

export type RipeningPhase =
  | "scheduled"
  | "ethylene_processing"
  | "post_ethylene_processing"
  | "ready_to_ship"
  | "completed"
  | "cancelled";

export type RipeningStatus = {
  id: string;
  ripeningNo: number;
  title: string;
  locationName: string;
  varietyName: string;
  weightKg: number;
  sortingTitles: string[];
  ethyleneEndedAt: string;
  shippableAt: string;
  phase: RipeningPhase;
  nextCheckAt: string | null;
  nextCheckType: "ethylene_end" | "shippable" | null;
  isEthyleneProcessing: boolean;
  isOverdue: boolean;
  isDueSoon: boolean;
};

export type RipeningLabelBreakdown = {
  sortingLogId: string;
  sortingTitle: string;
  harvestTitle: string;
  plotName: string;
  sizeCode: string;
  weightKg: number;
};

/** Complete, display-ready data for one physical container label. */
export type RipeningLabelData = {
  id: string;
  ripeningNo: number;
  title: string;
  staffName: string;
  locationName: string;
  varietyName: string;
  plotNames: string[];
  sizeCodes: string[];
  weightKg: number;
  startedAt: string;
  ethyleneTemperatureC: number | null;
  ethyleneStartedAt: string;
  ethyleneEndedAt: string;
  restingTemperatureC: number | null;
  restingStartedAt: string;
  shippableAt: string;
  notes: string | null;
  breakdown: RipeningLabelBreakdown[];
};

export type RipeningHistoryRow = Pick<
  RipeningLabelData,
  | "id"
  | "ripeningNo"
  | "title"
  | "locationName"
  | "varietyName"
  | "weightKg"
  | "startedAt"
  | "shippableAt"
> & {
  phase: RipeningPhase;
};

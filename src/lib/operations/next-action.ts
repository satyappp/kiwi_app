type HarvestActionSource = {
  varietyName: string;
  plotName: string;
  sortingDeadline: string;
};

type InventoryActionRow = {
  status: string;
  varietyName: string;
  weightKg: number;
  deadlineAt: string | null;
};

export type NextOperationAction = {
  message: string;
  href: string;
  label: string;
  kind: "sorting" | "ripening" | "shipping";
  deadline: string | null;
};

function formatWeight(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

/** Resolves the same highest-priority farm action for desktop and mobile. */
export function resolveNextOperationActions({
  harvests,
  inventoryRows,
  returnTo,
}: {
  harvests: HarvestActionSource[];
  inventoryRows: InventoryActionRow[];
  returnTo: "/dashboard" | "/home";
}): NextOperationAction[] {
  const actions: NextOperationAction[] = harvests.map((harvest) => ({
      message: `${harvest.varietyName}（${harvest.plotName}）の選果期限を確認してください。`,
      href: `/sorting/new?returnTo=${returnTo}`,
      label: "選果を入力",
      kind: "sorting",
      deadline: harvest.sortingDeadline,
    }));

  const coldItems = inventoryRows
    .filter((row) => row.status === "cold" && row.deadlineAt)
    .sort((left, right) => (left.deadlineAt ?? "").localeCompare(right.deadlineAt ?? ""));
  actions.push(...coldItems.map((item) => ({
      message: `${item.varietyName}の追熟開始期限を確認してください。`,
      href: "/ripening/new",
      label: "追熟を開始",
      kind: "ripening" as const,
      deadline: item.deadlineAt,
    })));

  const readyWeightKg = inventoryRows
    .filter((row) => row.status === "ready")
    .reduce((total, row) => total + row.weightKg, 0);
  if (readyWeightKg > 0) {
    actions.push({
        message: `${formatWeight(readyWeightKg)} kgの出荷可能在庫があります。`,
        href: "/shipping/new",
        label: "出荷を入力",
        kind: "shipping",
        deadline: null,
      });
  }
  return actions;
}

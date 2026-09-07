export const inventoryStatuses = [
  "cold",
  "ripening",
  "ready",
  "reserved",
  "shipped",
] as const;

export type InventoryStatus = (typeof inventoryStatuses)[number];

export type InventoryVariety = {
  id: string;
  name: string;
};

export type InventoryRow = {
  status: InventoryStatus;
  sourceId: string;
  title: string;
  varietyId: string;
  varietyName: string;
  plotName: string | null;
  sizeName: string | null;
  locationName: string | null;
  occurredAt: string;
  weightKg: number;
  deadlineAt: string | null;
  customerName: string | null;
};

export type InventoryOverview = {
  varieties: InventoryVariety[];
  rows: InventoryRow[];
};

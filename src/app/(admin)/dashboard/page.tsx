import {
  getHarvestDashboardData,
  HarvestDashboard,
  type HarvestPeriod,
} from "@/features/harvest";
import { getCurrentStaff } from "@/features/auth/server";
import { getInventoryOverview } from "@/features/inventory";
import { listActiveRipeningStatuses } from "@/features/ripening";

function parsePeriod(value: string | string[] | undefined): HarvestPeriod {
  return value === "today" || value === "week" ? value : "month";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const period = parsePeriod((await searchParams).period);
  const [staff, data, inventory, ripeningStatuses] = await Promise.all([
    getCurrentStaff(),
    getHarvestDashboardData(period),
    getInventoryOverview(),
    // トップ画面では対応優先度の高い「エチレン処理中」だけを表示する。
    // その他の進行中ロットは追熟管理ページの全体タイムラインで確認できる。
    listActiveRipeningStatuses({ phase: "ethylene_processing", limit: 100 }),
  ]);

  return (
    <HarvestDashboard
      data={data}
      inventory={inventory}
      ripeningStatuses={ripeningStatuses}
      staffName={staff?.name ?? "スタッフ"}
    />
  );
}

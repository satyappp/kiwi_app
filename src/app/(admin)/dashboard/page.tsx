import {
  getHarvestDashboardData,
  HarvestDashboard,
  type HarvestPeriod,
} from "@/features/harvest";
import { getCurrentStaff } from "@/features/auth/server";
import { getInventoryOverview } from "@/features/inventory";

function parsePeriod(value: string | string[] | undefined): HarvestPeriod {
  return value === "today" || value === "week" ? value : "month";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const period = parsePeriod((await searchParams).period);
  const [staff, data, inventory] = await Promise.all([
    getCurrentStaff(),
    getHarvestDashboardData(period),
    getInventoryOverview(),
  ]);

  return (
    <HarvestDashboard
      data={data}
      inventory={inventory}
      staffName={staff?.name ?? "スタッフ"}
    />
  );
}

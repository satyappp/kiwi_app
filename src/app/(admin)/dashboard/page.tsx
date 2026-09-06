import {
  getHarvestDashboardData,
  HarvestDashboard,
  type HarvestPeriod,
} from "@/features/harvest";
import { getCurrentStaff } from "@/features/auth/server";

function parsePeriod(value: string | string[] | undefined): HarvestPeriod {
  return value === "today" || value === "month" ? value : "week";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const period = parsePeriod((await searchParams).period);
  const [staff, data] = await Promise.all([
    getCurrentStaff(),
    getHarvestDashboardData(period),
  ]);

  return <HarvestDashboard data={data} staffName={staff?.name ?? "スタッフ"} />;
}

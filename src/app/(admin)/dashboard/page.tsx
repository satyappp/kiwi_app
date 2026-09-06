import {
  getCurrentStaff,
  getHarvestDashboardData,
  HarvestDashboard,
  type HarvestPeriod,
} from "@/features/harvest";
import { redirect } from "next/navigation";

function parsePeriod(value: string | string[] | undefined): HarvestPeriod {
  return value === "today" || value === "month" ? value : "week";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const period = parsePeriod((await searchParams).period);
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  const data = await getHarvestDashboardData(period);

  return <HarvestDashboard data={data} staffName={staff.name} />;
}

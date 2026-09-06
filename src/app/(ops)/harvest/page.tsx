import { HarvestHistoryScreen } from "@/features/harvest/components/harvest-history-screen";
import { getCurrentStaff, listHarvestLogs } from "@/features/harvest";
import { redirect } from "next/navigation";

export default async function HarvestHistoryPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  const rows = await listHarvestLogs(50);
  return <HarvestHistoryScreen rows={rows} />;
}

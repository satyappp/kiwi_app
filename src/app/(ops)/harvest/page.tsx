import { HarvestHistoryScreen } from "@/features/harvest/components/harvest-history-screen";
import { listHarvestLogs } from "@/features/harvest";

export default async function HarvestHistoryPage() {
  const rows = await listHarvestLogs(50);
  return <HarvestHistoryScreen rows={rows} />;
}

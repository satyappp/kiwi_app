import { AppHeader } from "@/features/home/components/app-header";
import { MenuGrid } from "@/features/home/components/menu-grid";
import { TodayTasks } from "@/features/home/components/today-tasks";
import { getHarvestDashboardData } from "@/features/harvest";
import { getInventoryOverview } from "@/features/inventory";
import { resolveNextOperationActions } from "@/lib/operations/next-action";

export async function QuickEntryHome() {
  const [dashboard, inventory] = await Promise.all([
    getHarvestDashboardData("today"),
    getInventoryOverview(),
  ]);
  const nextActions = resolveNextOperationActions({
    harvests: dashboard.nextActions,
    inventoryRows: inventory.rows,
    returnTo: "/home",
  });

  return (
    <>
      <AppHeader />
      <main className="flex-1 pt-[5%]">
        <MenuGrid />
        <TodayTasks nextActions={nextActions} />
      </main>
    </>
  );
}

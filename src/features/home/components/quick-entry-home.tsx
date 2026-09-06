import { AppHeader } from "@/features/home/components/app-header";
import { MenuGrid } from "@/features/home/components/menu-grid";
import { TodayTasks } from "@/features/home/components/today-tasks";
import { RecentHarvests } from "@/features/home/components/recent-harvests";
import { listHarvestLogs } from "@/features/harvest";

export async function QuickEntryHome() {
  const recentHarvests = await listHarvestLogs(3);

  return (
    <>
      <AppHeader />
      <main className="flex-1 pt-[5%]">
        <MenuGrid />
        <RecentHarvests rows={recentHarvests} />
        <TodayTasks />
      </main>
    </>
  );
}

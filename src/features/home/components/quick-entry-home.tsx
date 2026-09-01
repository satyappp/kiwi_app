import { AppHeader } from "@/features/home/components/app-header";
import { MenuGrid } from "@/features/home/components/menu-grid";
import { TodayTasks } from "@/features/home/components/today-tasks";

export function QuickEntryHome() {
  return (
    <>
      <AppHeader />
      <main className="flex-1 pt-[5%]">
        <MenuGrid />
        <TodayTasks />
      </main>
    </>
  );
}

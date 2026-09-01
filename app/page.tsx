import { AppHeader } from "@/components/home/app-header";
import { MenuGrid } from "@/components/home/menu-grid";
import { TodayTasks } from "@/components/home/today-tasks";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-kiwi-cream">
      <div className="@container relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-kiwi-cream bg-[url('/assets/backgrounds/phone/kiwi-bg-1179x2556.png')] bg-[length:100%_auto] bg-top bg-no-repeat shadow-[0_0_50px_rgba(60,80,40,0.12)]">
        <AppHeader />
        <main className="flex-1 pt-[5%]">
          <MenuGrid />
          <TodayTasks />
        </main>
      </div>
    </div>
  );
}

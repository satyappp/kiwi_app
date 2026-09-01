import { BackButton } from "@/components/layout/back-button";
import { HarvestForm } from "@/features/harvest/components/harvest-form";
import {
  getCurrentStaff,
  getHarvestFormOptions,
} from "@/features/harvest/queries";

const JST = "Asia/Tokyo";

function nowInJst() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: JST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: JST,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  return { date, time };
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export async function NewHarvestScreen() {
  const [options, currentStaff] = await Promise.all([
    getHarvestFormOptions(),
    getCurrentStaff(),
  ]);
  const { date, time } = nowInJst();

  return (
    <main className="flex-1 px-[7%] pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="relative mb-8 flex h-11 items-center justify-center">
        <div className="absolute -left-2">
          <BackButton fallbackHref="/" />
        </div>
        <h1 className="text-[clamp(1.1rem,5cqw,1.35rem)] font-bold text-kiwi-ink">
          収穫登録
        </h1>
      </header>

      <HarvestForm
        currentStaff={currentStaff}
        options={options}
        defaultDate={date}
        defaultTime={time}
        defaultSortingDeadline={addDays(date, 30)}
      />
    </main>
  );
}

import { SortingForm } from "@/features/sorting/components/sorting-form";
import { SortingBackButton } from "@/features/sorting/components/sorting-back-button";
import {
  getCurrentSortingStaff,
  getSortingFormOptions,
} from "@/features/sorting/queries";

const JST = "Asia/Tokyo";

/** Default sorting date shown to the worker; it remains editable in the form. */
function todayInJst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Server component for /sorting/new.
 * Fetches form options and staff in parallel, then composes the operational
 * header and client form without putting data access in the route file.
 */
export async function NewSortingScreen() {
  const [options, currentStaff] = await Promise.all([
    getSortingFormOptions(),
    getCurrentSortingStaff(),
  ]);

  return (
    <main className="flex-1 px-[7%] pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="relative mb-8 flex h-11 items-center justify-center">
        <div className="absolute -left-2">
          <SortingBackButton />
        </div>
        <h1 className="text-[clamp(1.1rem,5cqw,1.35rem)] font-bold text-kiwi-ink">
          選果入力
        </h1>
      </header>

      <SortingForm
        currentStaff={currentStaff}
        options={options}
        defaultSortingDate={todayInJst()}
      />
    </main>
  );
}

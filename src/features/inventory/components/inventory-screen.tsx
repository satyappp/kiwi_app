import { BackButton } from "@/components/layout/back-button";
import { InventoryBrowser } from "@/features/inventory/components/inventory-browser";
import { getInventoryOverview } from "@/features/inventory/queries";

export async function InventoryScreen() {
  const overview = await getInventoryOverview();

  return (
    <main className="flex-1 px-[7%] pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="relative mb-6 flex h-11 items-center justify-center">
        <div className="absolute -left-2">
          <BackButton fallbackHref="/home" />
        </div>
        <h1 className="text-[clamp(1.1rem,5cqw,1.35rem)] font-bold text-kiwi-ink">
          在庫確認
        </h1>
      </header>

      <InventoryBrowser varieties={overview.varieties} rows={overview.rows} />
    </main>
  );
}

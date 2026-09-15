import { InventoryBrowser } from "@/features/inventory/components/inventory-browser";
import { getInventoryOverview } from "@/features/inventory";

/** Desktop inventory view; the phone surface reuses the same query and browser. */
export default async function DashboardInventoryPage() {
  const inventory = await getInventoryOverview();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold tracking-[0.12em] text-kiwi">INVENTORY</p>
        <h1 className="mt-2 text-2xl font-bold text-kiwi-ink sm:text-3xl">
          在庫確認
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          品種と工程を選んで、現在の在庫内訳を確認できます。
        </p>
      </header>
      <InventoryBrowser varieties={inventory.varieties} rows={inventory.rows} />
    </div>
  );
}

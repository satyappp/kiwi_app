import Link from "next/link";
import { Plus } from "lucide-react";

import { BackButton } from "@/components/layout/back-button";
import { HarvestCardList } from "@/features/harvest/components/harvest-card-list";
import type { HarvestLogRow } from "@/features/harvest/schema";

export function HarvestHistoryScreen({ rows }: { rows: HarvestLogRow[] }) {
  return (
    <div className="flex min-h-dvh flex-col px-[7%] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="flex items-center justify-between pt-[calc(env(safe-area-inset-top)+1rem)] pb-5">
        <BackButton />
        <h1 className="text-lg font-bold text-kiwi-ink">収穫履歴</h1>
        <Link href="/harvest/new" aria-label="収穫を記録" className="grid size-11 place-items-center rounded-full bg-kiwi text-white shadow-md active:scale-95">
          <Plus className="size-5" />
        </Link>
      </header>
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">最新{rows.length}件</p>
      </div>
      <HarvestCardList rows={rows} />
    </div>
  );
}

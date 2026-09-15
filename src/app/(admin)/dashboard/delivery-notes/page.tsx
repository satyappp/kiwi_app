import { FileText, Plus } from "lucide-react";
import Link from "next/link";

import { DeliveryNoteTable, listDeliveryNotes } from "@/features/delivery-notes";

export default async function DeliveryNotesPage() {
  const rows = await listDeliveryNotes(1000);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kiwi-ink sm:text-3xl">納品書</h1>
        </div>
        <Link href="/shipping/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#557f3e] px-4 text-sm font-bold text-white hover:bg-[#466d33]">
          <Plus className="size-4" />出荷を登録
        </Link>
      </header>

      <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_14px_34px_-22px_rgba(55,75,35,.28)]">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <span className="grid size-9 place-items-center rounded-xl bg-kiwi-pale/50 text-kiwi-ink"><FileText className="size-4" /></span>
          <div>
            <h2 className="font-bold text-kiwi-ink">納品書一覧</h2>
          </div>
        </div>
        <DeliveryNoteTable rows={rows} />
      </section>
    </div>
  );
}

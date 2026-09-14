import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DeliveryNoteEditor,
  getDeliveryNote,
  listDeliveryNotes,
} from "@/features/delivery-notes";

export default async function DeliveryNoteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [initialSource, allSources] = await Promise.all([
    getDeliveryNote(id),
    listDeliveryNotes(1000),
  ]);
  if (!initialSource) notFound();

  const candidateSources = allSources.filter(
    (source) =>
      source.id !== initialSource.id &&
      !source.cancelledAt &&
      source.businessPartnerId === initialSource.businessPartnerId,
  );

  return (
    <div className="space-y-6">
      <header>
        <Link href="/dashboard/delivery-notes" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-kiwi-ink">
          <ArrowLeft className="size-4" />納品書一覧
        </Link>
        <h1 className="text-2xl font-bold text-kiwi-ink sm:text-3xl">納品書作成</h1>
      </header>

      {initialSource.cancelledAt && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">この出荷記録は取り消されています。</p>
      )}

      <DeliveryNoteEditor initialSource={initialSource} candidateSources={candidateSources} />
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LabelActions } from "@/components/printing/label-actions";
import { getCurrentStaff } from "@/features/auth/server";
import { HarvestLabel } from "@/features/harvest/components/harvest-label";
import { getHarvestLabel } from "@/features/harvest/queries";

export default async function HarvestLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await getCurrentStaff();
  if (!staff) redirect(`/login?next=${encodeURIComponent(`/harvest/${id}/label`)}`);

  const data = await getHarvestLabel(id);
  if (!data) notFound();

  return (
    <main className="min-h-dvh bg-[#eef3e9] px-4 py-6 print:h-[148mm] print:min-h-0 print:w-[210mm] print:overflow-hidden print:bg-white print:p-0 sm:py-10">
      <style>{`
        @page { size: A5 landscape; margin: 0; }
        @media print {
          html, body {
            width: 210mm !important;
            height: 148mm !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
        }
      `}</style>
      <div className="print:hidden mx-auto mb-5 flex max-w-[210mm] items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-kiwi">CONTAINER LABEL</p>
          <h1 className="mt-1 text-xl font-bold text-kiwi-ink">{data.title}</h1>
        </div>
        <Link href={`/dashboard/harvest/${id}`} className="text-sm font-bold text-muted-foreground hover:text-kiwi-ink">
          詳細に戻る
        </Link>
      </div>
      <div className="mx-auto w-fit max-w-full overflow-auto print:overflow-visible">
        <HarvestLabel data={data} />
      </div>
      <div className="mt-6">
        <LabelActions pdfHref={`/api/harvest/${id}/label`} />
      </div>
      <p className="print:hidden mx-auto mt-3 max-w-[210mm] text-center text-xs text-muted-foreground">
        用紙はA5・横向き・倍率100%で印刷してください。
      </p>
    </main>
  );
}

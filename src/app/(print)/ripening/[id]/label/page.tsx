import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LabelActions } from "@/components/printing/label-actions";
import { RipeningLabel } from "@/features/ripening/components/ripening-label";
import { getRipeningLabel } from "@/features/ripening/queries";
import { getCurrentStaff } from "@/features/auth/server";

export default async function RipeningLabelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await getCurrentStaff();
  if (!staff) redirect(`/login?next=${encodeURIComponent(`/ripening/${id}/label`)}`);

  const data = await getRipeningLabel(id);
  if (!data) notFound();

  return (
    <main className="min-h-dvh bg-[#eef3e9] px-4 py-6 print:h-[210mm] print:min-h-0 print:w-[297mm] print:overflow-hidden print:bg-white print:p-0 sm:py-10">
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
        }
      `}</style>
      <div className="print:hidden mx-auto mb-5 flex max-w-[297mm] items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-kiwi">CONTAINER LABEL</p>
          <h1 className="mt-1 text-xl font-bold text-kiwi-ink">{data.title}</h1>
        </div>
        <Link href={`/dashboard/ripening/${id}`} className="text-sm font-bold text-muted-foreground hover:text-kiwi-ink">
          詳細に戻る
        </Link>
      </div>
      <div className="mx-auto w-fit max-w-full overflow-auto print:overflow-visible">
        <RipeningLabel data={data} />
      </div>
      <div className="mt-6">
        <LabelActions pdfHref={`/api/ripening/${id}/label`} />
      </div>
      <p className="print:hidden mx-auto mt-3 max-w-[148mm] text-center text-xs text-muted-foreground">
        用紙はA4・横向き・倍率100%で印刷してください。
      </p>
    </main>
  );
}

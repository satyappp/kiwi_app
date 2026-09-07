import { getRipeningLabel } from "@/features/ripening/queries";
import { createRipeningLabelPdf } from "@/features/ripening/label-pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getRipeningLabel(id);
  if (!data) return new Response("Not found", { status: 404 });

  const pdf = await createRipeningLabelPdf(data);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ripening-label-${data.ripeningNo}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

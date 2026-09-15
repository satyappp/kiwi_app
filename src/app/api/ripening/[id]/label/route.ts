import { getRipeningLabel } from "@/features/ripening/queries";
import { createRipeningLabelPdf } from "@/features/ripening/label-pdf";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response("Unauthorized", { status: 401 });
  }

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

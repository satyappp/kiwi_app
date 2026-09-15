import { createDeliveryNotePdf, getDeliveryNote } from "@/features/delivery-notes";
import {
  buildDeliveryNoteDocument,
  deliveryNoteFileName,
  deliveryNoteDraftFromShipping,
} from "@/features/delivery-notes/format";
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

  const data = await getDeliveryNote(id);
  if (!data) return new Response("Not found", { status: 404 });
  const pdf = await createDeliveryNotePdf(
    buildDeliveryNoteDocument(deliveryNoteDraftFromShipping(data)),
  );
  const fileName = deliveryNoteFileName(data.deliveryDate, data.recipientName);

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="delivery-note.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

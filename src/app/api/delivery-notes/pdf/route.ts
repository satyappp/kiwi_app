import { createDeliveryNotePdf } from "@/features/delivery-notes";
import {
  buildDeliveryNoteDocument,
  deliveryNoteFileName,
} from "@/features/delivery-notes/format";
import { deliveryNoteDraftSchema } from "@/features/delivery-notes/schema";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const parsed = deliveryNoteDraftSchema.safeParse(payload);
  if (!parsed.success) return new Response("Invalid delivery note", { status: 400 });

  const document = buildDeliveryNoteDocument(parsed.data);
  const pdf = await createDeliveryNotePdf(document);
  const fileName = deliveryNoteFileName(document.deliveryDate, document.recipientName);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="delivery-note.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

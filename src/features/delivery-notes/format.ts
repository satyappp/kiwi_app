import { DELIVERY_NOTE_TAX_RATE } from "@/features/delivery-notes/config";
import type {
  DeliveryNoteData,
  DeliveryNoteDocument,
  DeliveryNoteDraft,
} from "@/features/delivery-notes/schema";

export function deliveryNoteNumber(deliveryDate: string, id: string) {
  return `DN-${deliveryDate.replaceAll("-", "")}-${id.slice(0, 8).toUpperCase()}`;
}

export function calculateDeliveryNoteAmounts(
  quantityKg: number,
  unitPriceYenPerKg: number,
) {
  const subtotalYen = Math.round(quantityKg * unitPriceYenPerKg);
  const taxYen = Math.floor(subtotalYen * DELIVERY_NOTE_TAX_RATE);
  return {
    subtotalYen,
    taxRate: DELIVERY_NOTE_TAX_RATE,
    taxYen,
    totalYen: subtotalYen + taxYen,
  };
}

export function deliveryNoteItemName(data: {
  varietyName: string;
  sizeCode: string;
  packageFormat: string | null;
}) {
  return [data.varietyName, data.sizeCode, data.packageFormat]
    .filter(Boolean)
    .join(" / ");
}

export function deliveryNoteDraftFromShipping(
  data: DeliveryNoteData,
): DeliveryNoteDraft {
  return {
    documentNumber: data.documentNumber,
    deliveryDate: data.deliveryDate,
    recipientName: data.recipientName,
    recipientHonorific: "御中",
    recipientPostalCode: data.recipientPostalCode ?? "",
    recipientAddress: data.recipientAddress ?? "",
    subject: deliveryNoteItemName(data),
    notes: data.notes ?? "",
    items: [{
      id: data.id,
      sourceShippingSaleId: data.id,
      description: deliveryNoteItemName(data),
      quantity: data.quantityKg,
      unit: "kg",
      unitPriceYen: data.unitPriceYenPerKg,
      taxRate: DELIVERY_NOTE_TAX_RATE,
    }],
  };
}

export function buildDeliveryNoteDocument(
  draft: DeliveryNoteDraft,
): DeliveryNoteDocument {
  const items = draft.items.map((item) => {
    const subtotalYen = Math.round(item.quantity * item.unitPriceYen);
    const taxYen = Math.floor(subtotalYen * item.taxRate);
    return { ...item, subtotalYen, taxYen, totalYen: subtotalYen + taxYen };
  });
  return {
    ...draft,
    items,
    subtotalYen: items.reduce((sum, item) => sum + item.subtotalYen, 0),
    taxYen: items.reduce((sum, item) => sum + item.taxYen, 0),
    totalYen: items.reduce((sum, item) => sum + item.totalYen, 0),
  };
}

export function formatYen(value: number) {
  return `${Math.round(value).toLocaleString("ja-JP")}円`;
}

export function formatKg(value: number) {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function deliveryNoteFileName(deliveryDate: string, recipientName: string) {
  const safeDate = deliveryDate.replace(/[^0-9-]/g, "") || "日付未設定";
  const safeRecipient = recipientName
    .trim()
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 80) || "宛名未設定";
  return `納品証_${safeDate}_${safeRecipient}.pdf`;
}

export function formatJapaneseDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

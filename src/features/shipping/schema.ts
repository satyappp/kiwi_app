import { z } from "zod";

const requiredId = (label: string) => z.string().uuid(`${label}を選択してください。`);
const numericText = (label: string, minimum: number, allowZero = false) =>
  z.string().trim().min(1, `${label}を入力してください。`).transform(Number)
    .refine((value) => Number.isFinite(value) && (allowZero ? value >= minimum : value > minimum), `${label}を正しく入力してください。`);

export const shippingSaleInputSchema = z.object({
  businessPartnerId: requiredId("取引先"),
  varietyId: requiredId("品種"),
  sizeStandardId: requiredId("サイズ"),
  deliveryPackageId: z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null),
  quantityKg: numericText("数量", 0),
  unitPriceYenPerKg: numericText("単価", 0, true),
  deliveryDate: z.iso.date("納品日を入力してください。"),
  shippingDate: z.iso.date("出荷日を入力してください。"),
  notes: z.string().trim().max(500, "備考は500文字以内で入力してください。").transform((value) => value || null),
}).refine((value) => value.deliveryDate >= value.shippingDate, {
  path: ["deliveryDate"], message: "納品日は出荷日以降にしてください。",
});

export type ShippingFormOptions = {
  partners: { id: string; name: string }[];
  inventory: { varietyId: string; varietyName: string; sizeStandardId: string; sizeCode: string; availableWeightKg: number }[];
  packages: { id: string; varietyId: string; sizeStandardId: string; name: string; format: string | null; unitPriceYenPerKg: number | null }[];
};

export type ShippingSaleStatus = "reserved" | "shipped" | "cancelled";

export type ShippingSaleRow = {
  id: string;
  partnerName: string;
  varietyName: string;
  sizeCode: string;
  packageName: string | null;
  quantityKg: number;
  unitPriceYenPerKg: number;
  totalPriceYen: number;
  shippingDate: string;
  deliveryDate: string;
  notes: string | null;
  createdAt: string;
  staffName: string;
  status: ShippingSaleStatus;
};

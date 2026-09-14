import { z } from "zod";

export type DeliveryNoteData = {
  id: string;
  businessPartnerId: string;
  documentNumber: string;
  createdAt: string;
  cancelledAt: string | null;
  deliveryDate: string;
  shippingDate: string;
  recipientName: string;
  recipientShortName: string;
  recipientPostalCode: string | null;
  recipientAddress: string | null;
  varietyName: string;
  sizeCode: string;
  sizeName: string;
  packageName: string | null;
  packageFormat: string | null;
  quantityKg: number;
  unitPriceYenPerKg: number;
  subtotalYen: number;
  taxRate: number;
  taxYen: number;
  totalYen: number;
  notes: string | null;
  staffName: string;
};

export const deliveryNoteDraftSchema = z.object({
  documentNumber: z.string().trim().min(1).max(80),
  deliveryDate: z.iso.date(),
  recipientName: z.string().trim().min(1).max(200),
  recipientHonorific: z.enum(["御中", "様"]),
  recipientPostalCode: z.string().trim().max(30),
  recipientAddress: z.string().trim().max(300),
  subject: z.string().trim().min(1).max(300),
  notes: z.string().trim().max(1000),
  items: z.array(z.object({
    id: z.string().max(100),
    sourceShippingSaleId: z.string().uuid().nullable(),
    description: z.string().trim().min(1).max(300),
    quantity: z.number().positive().max(100000),
    unit: z.string().trim().min(1).max(20),
    unitPriceYen: z.number().nonnegative().max(100000000),
    taxRate: z.number().min(0).max(1),
  })).min(1).max(9),
});

export type DeliveryNoteDraft = z.infer<typeof deliveryNoteDraftSchema>;

export type DeliveryNoteDocumentItem = DeliveryNoteDraft["items"][number] & {
  subtotalYen: number;
  taxYen: number;
  totalYen: number;
};

export type DeliveryNoteDocument = Omit<DeliveryNoteDraft, "items"> & {
  items: DeliveryNoteDocumentItem[];
  subtotalYen: number;
  taxYen: number;
  totalYen: number;
};

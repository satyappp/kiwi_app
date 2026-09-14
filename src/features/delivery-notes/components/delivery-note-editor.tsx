"use client";

import { Download, FilePlus2, Plus, Printer, Trash2 } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { DeliveryNote } from "@/features/delivery-notes/components/delivery-note";
import {
  buildDeliveryNoteDocument,
  deliveryNoteFileName,
  deliveryNoteDraftFromShipping,
  deliveryNoteItemName,
  formatJapaneseDate,
  formatYen,
} from "@/features/delivery-notes/format";
import {
  deliveryNoteDraftSchema,
  type DeliveryNoteData,
  type DeliveryNoteDraft,
} from "@/features/delivery-notes/schema";

const fieldClass = "space-y-1.5";
const labelClass = "text-xs font-bold text-kiwi-ink";
const controlClass = "h-11 rounded-xl bg-white px-3.5 text-[15px] shadow-sm";
const selectClass = "h-11 rounded-xl bg-white text-[15px]";
const textareaClass = "min-h-24 w-full resize-y rounded-xl border border-input bg-white px-3.5 py-2.5 text-[15px] shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";
const A4_WIDTH_PX = 210 * 96 / 25.4;
const A4_HEIGHT_PX = 297 * 96 / 25.4;

function ScaledDeliveryNotePreview({ data }: { data: ReturnType<typeof buildDeliveryNoteDocument> }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const updateScale = () => {
      const horizontalPadding = window.innerWidth < 640 ? 16 : 32;
      setScale(Math.min(
        1,
        Math.max(0.25, (frame.clientWidth - horizontalPadding) / A4_WIDTH_PX),
        Math.max(0.25, (frame.clientHeight - horizontalPadding) / A4_HEIGHT_PX),
      ));
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    updateScale();
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="grid h-[calc(100dvh-160px)] min-h-[520px] max-h-[820px] place-items-start justify-center overflow-hidden bg-transparent">
      <div className="border border-kiwi/15 bg-white" style={{ width: A4_WIDTH_PX * scale, height: A4_HEIGHT_PX * scale }}>
        <div id="delivery-note-live-preview" style={{ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <DeliveryNote data={data} />
        </div>
      </div>
    </div>
  );
}

function sourceItem(source: DeliveryNoteData): DeliveryNoteDraft["items"][number] {
  return {
    id: source.id,
    sourceShippingSaleId: source.id,
    description: deliveryNoteItemName(source),
    quantity: source.quantityKg,
    unit: "kg",
    unitPriceYen: source.unitPriceYenPerKg,
    taxRate: source.taxRate,
  };
}

export function DeliveryNoteEditor({
  initialSource,
  candidateSources,
}: {
  initialSource: DeliveryNoteData;
  candidateSources: DeliveryNoteData[];
}) {
  const [draft, setDraft] = useState<DeliveryNoteDraft>(() => deliveryNoteDraftFromShipping(initialSource));
  const [candidateId, setCandidateId] = useState("");
  const [pdfPending, setPdfPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const document = useMemo(() => buildDeliveryNoteDocument(draft), [draft]);
  const usedSourceIds = new Set(draft.items.map((item) => item.sourceShippingSaleId).filter(Boolean));
  const availableCandidates = candidateSources.filter((source) => !usedSourceIds.has(source.id));

  function updateDraft<K extends keyof DeliveryNoteDraft>(key: K, value: DeliveryNoteDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index: number, patch: Partial<DeliveryNoteDraft["items"][number]>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  }

  function addShippingSource() {
    const source = availableCandidates.find((candidate) => candidate.id === candidateId);
    if (!source || draft.items.length >= 9) return;
    setDraft((current) => ({ ...current, items: [...current.items, sourceItem(source)] }));
    setCandidateId("");
  }

  function addBlankItem() {
    if (draft.items.length >= 9) return;
    setDraft((current) => ({
      ...current,
      items: [...current.items, {
        id: `manual-${crypto.randomUUID()}`,
        sourceShippingSaleId: null,
        description: "",
        quantity: 1,
        unit: "kg",
        unitPriceYen: 0,
        taxRate: 0.1,
      }],
    }));
  }

  function removeItem(index: number) {
    if (draft.items.length <= 1) return;
    setDraft((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function validatedDraft() {
    const parsed = deliveryNoteDraftSchema.safeParse(draft);
    if (!parsed.success) {
      setError("未入力または正しくない明細があります。品名・数量・単位・単価を確認してください。");
      return null;
    }
    setError(null);
    return parsed.data;
  }

  async function savePdf() {
    const payload = validatedDraft();
    if (!payload) return;
    setPdfPending(true);
    try {
      const response = await fetch("/api/delivery-notes/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("PDF request failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = deliveryNoteFileName(payload.deliveryDate, payload.recipientName);
      window.document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("PDFを作成できませんでした。もう一度お試しください。");
    } finally {
      setPdfPending(false);
    }
  }

  function printDocument() {
    if (!validatedDraft()) return;
    window.print();
  }

  return (
    <>
      <style jsx global>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { width: 210mm !important; height: 297mm !important; margin: 0 !important; overflow: hidden !important; }
          body * { visibility: hidden !important; }
          #delivery-note-live-preview, #delivery-note-live-preview * { visibility: visible !important; }
          #delivery-note-live-preview { position: absolute !important; inset: 0 auto auto 0 !important; width: 210mm !important; height: 297mm !important; overflow: hidden !important; transform: none !important; }
        }
      `}</style>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(430px,.9fr)_minmax(380px,1.1fr)]">
        <section className="space-y-5 rounded-2xl bg-white/90 p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-kiwi-ink">納品書を編集</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className={fieldClass}>
              <Label htmlFor="document-number" className={labelClass}>納品書番号</Label>
              <Input id="document-number" className={controlClass} value={draft.documentNumber} onChange={(event) => updateDraft("documentNumber", event.target.value)} />
            </div>
            <div className={fieldClass}>
              <Label htmlFor="delivery-date" className={labelClass}>納品日</Label>
              <Input id="delivery-date" className={controlClass} type="date" value={draft.deliveryDate} onChange={(event) => updateDraft("deliveryDate", event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_92px] gap-3">
            <div className={fieldClass}>
              <Label htmlFor="recipient-name" className={labelClass}>宛名</Label>
              <Input id="recipient-name" className={controlClass} value={draft.recipientName} onChange={(event) => updateDraft("recipientName", event.target.value)} />
            </div>
            <div className={fieldClass}>
              <Label htmlFor="honorific" className={labelClass}>敬称</Label>
              <NativeSelect id="honorific" className={selectClass} value={draft.recipientHonorific} onChange={(event) => updateDraft("recipientHonorific", event.target.value as "御中" | "様")}>
                <option value="御中">御中</option><option value="様">様</option>
              </NativeSelect>
            </div>
          </div>

          <div className={fieldClass}>
            <Label htmlFor="postal-code" className={labelClass}>郵便番号（任意）</Label>
            <Input id="postal-code" className={controlClass} value={draft.recipientPostalCode} onChange={(event) => updateDraft("recipientPostalCode", event.target.value)} placeholder="〒000-0000" />
          </div>
          <div className={fieldClass}>
            <Label htmlFor="recipient-address" className={labelClass}>住所（任意）</Label>
            <textarea id="recipient-address" value={draft.recipientAddress} onChange={(event) => updateDraft("recipientAddress", event.target.value)} className={textareaClass} />
          </div>
          <div className={fieldClass}>
            <Label htmlFor="subject" className={labelClass}>件名</Label>
            <Input id="subject" className={controlClass} value={draft.subject} onChange={(event) => updateDraft("subject", event.target.value)} />
          </div>

          <div className="space-y-3 border-t pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-kiwi-ink">明細</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addBlankItem} disabled={draft.items.length >= 9}>
                <Plus className="size-4" />手入力
              </Button>
            </div>

            {availableCandidates.length > 0 && (
              <div className="rounded-xl bg-kiwi-pale/20 p-3">
                <Label htmlFor="shipping-source" className={labelClass}>同じ取引先の出荷を追加</Label>
                <div className="mt-2 flex gap-2">
                  <div className="min-w-0 flex-1">
                    <NativeSelect id="shipping-source" value={candidateId} onChange={(event) => setCandidateId(event.target.value)} className={selectClass}>
                      <option value="">出荷記録を選択</option>
                      {availableCandidates.map((source) => (
                        <option key={source.id} value={source.id}>{formatJapaneseDate(source.deliveryDate)}・{deliveryNoteItemName(source)}・{source.quantityKg}kg</option>
                      ))}
                    </NativeSelect>
                  </div>
                  <Button type="button" variant="outline" size="icon" aria-label="選択した出荷を追加" onClick={addShippingSource} disabled={!candidateId || draft.items.length >= 9} className="size-11 rounded-xl">
                    <FilePlus2 className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {draft.items.map((item, index) => (
              <article key={item.id} className="space-y-3 rounded-xl border bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-muted-foreground">明細 {index + 1}</span>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`明細${index + 1}を削除`} disabled={draft.items.length <= 1} onClick={() => removeItem(index)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
                <div className={fieldClass}>
                  <Label htmlFor={`description-${index}`} className={labelClass}>品名</Label>
                  <Input id={`description-${index}`} className={controlClass} value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className={fieldClass}>
                    <Label htmlFor={`quantity-${index}`} className={labelClass}>数量</Label>
                    <Input id={`quantity-${index}`} className={controlClass} type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} />
                  </div>
                  <div className={fieldClass}>
                    <Label htmlFor={`unit-${index}`} className={labelClass}>単位</Label>
                    <Input id={`unit-${index}`} className={controlClass} value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value })} />
                  </div>
                  <div className={fieldClass}>
                    <Label htmlFor={`tax-${index}`} className={labelClass}>税率</Label>
                    <NativeSelect id={`tax-${index}`} className={selectClass} value={String(item.taxRate)} onChange={(event) => updateItem(index, { taxRate: Number(event.target.value) })}>
                      <option value="0.1">10%</option><option value="0.08">8%</option><option value="0">0%</option>
                    </NativeSelect>
                  </div>
                </div>
                <div className={fieldClass}>
                  <Label htmlFor={`price-${index}`} className={labelClass}>単価（円）</Label>
                  <Input id={`price-${index}`} className={controlClass} type="number" min="0" step="1" value={item.unitPriceYen} onChange={(event) => updateItem(index, { unitPriceYen: Number(event.target.value) })} />
                </div>
              </article>
            ))}
          </div>

          <div className={fieldClass}>
            <Label htmlFor="notes" className={labelClass}>備考（任意）</Label>
            <textarea id="notes" value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} className={textareaClass} />
          </div>

          <div className="border-t pt-4">
            <p className="flex items-center justify-between text-sm text-muted-foreground"><span>小計</span><strong className="text-kiwi-ink">{formatYen(document.subtotalYen)}</strong></p>
            <p className="mt-1 flex items-center justify-between text-sm text-muted-foreground"><span>消費税</span><strong className="text-kiwi-ink">{formatYen(document.taxYen)}</strong></p>
            <p className="mt-2 flex items-center justify-between text-base font-bold text-kiwi-ink"><span>合計</span><span>{formatYen(document.totalYen)}</span></p>
          </div>

          {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Button type="button" variant="outline" onClick={printDocument} className="h-11 rounded-xl font-bold"><Printer className="size-4" />印刷</Button>
            <Button type="button" onClick={savePdf} disabled={pdfPending} className="h-11 rounded-xl font-bold"><Download className="size-4" />{pdfPending ? "PDF作成中…" : "PDFで保存"}</Button>
          </div>
        </section>

        <section className="min-w-0 xl:sticky xl:top-[92px]">
          <ScaledDeliveryNotePreview data={document} />
        </section>
      </div>
    </>
  );
}

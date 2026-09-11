"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createShippingSale, type CreateShippingSaleResult } from "@/features/shipping/actions";
import type { ShippingFormOptions } from "@/features/shipping/schema";

const initialState: CreateShippingSaleResult | null = null;
const labelClass = "text-[13px] font-bold text-kiwi-ink";
const textareaClass = "min-h-24 w-full resize-y rounded-xl border border-input bg-card px-3.5 py-2.5 text-[15px] shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor} className={labelClass}>{label}</Label>{children}{error && <p className="text-sm text-destructive">{error}</p>}</div>;
}

export function ShippingSaleForm({ options, defaultDate }: { options: ShippingFormOptions; defaultDate: string }) {
  const [state, action, pending] = useActionState(createShippingSale, initialState);
  const [partnerId, setPartnerId] = useState("");
  const [varietyId, setVarietyId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const varieties = useMemo(() => Array.from(new Map(options.inventory.map((row) => [row.varietyId, { id: row.varietyId, name: row.varietyName }])).values()), [options.inventory]);
  const sizes = options.inventory.filter((row) => row.varietyId === varietyId);
  const stock = sizes.find((row) => row.sizeStandardId === sizeId);
  const packages = options.packages.filter((row) => row.varietyId === varietyId && row.sizeStandardId === sizeId);

  function changePackage(id: string) {
    setPackageId(id);
    const selected = packages.find((item) => item.id === id);
    setUnitPrice(selected?.unitPriceYenPerKg == null ? "" : String(selected.unitPriceYenPerKg));
  }

  const errors = state && !state.ok && "fieldErrors" in state ? state.fieldErrors : undefined;
  return <form action={action} className="space-y-4">
    {state?.ok && <div role="status" className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-kiwi-ink">出荷・販売を登録し、在庫を引き当てました。</div>}
    {state && !state.ok && "formError" in state && <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.formError}</div>}

    <Field label="取引先" htmlFor="partner" error={errors?.businessPartnerId?.[0]}><NativeSelect id="partner" name="businessPartnerId" value={partnerId} onChange={(e) => { setPartnerId(e.target.value); setVarietyId(""); setSizeId(""); setPackageId(""); setUnitPrice(""); }} required><option value="">取引先を選択</option>{options.partners.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect></Field>
    <Field label="品種" htmlFor="variety" error={errors?.varietyId?.[0]}><NativeSelect id="variety" name="varietyId" value={varietyId} disabled={!partnerId} onChange={(e) => { setVarietyId(e.target.value); setSizeId(""); setPackageId(""); setUnitPrice(""); }} required><option value="">品種を選択</option>{varieties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect></Field>
    <Field label="サイズ" htmlFor="size" error={errors?.sizeStandardId?.[0]}><NativeSelect id="size" name="sizeStandardId" value={sizeId} disabled={!varietyId} onChange={(e) => { setSizeId(e.target.value); setPackageId(""); setUnitPrice(""); }} required><option value="">在庫があるサイズを選択</option>{sizes.map((item) => <option key={item.sizeStandardId} value={item.sizeStandardId}>{item.sizeCode}（{item.availableWeightKg.toLocaleString("ja-JP")} kg）</option>)}</NativeSelect></Field>

    <Field label="納品パッケージ（任意）" htmlFor="package"><NativeSelect id="package" name="deliveryPackageId" value={packageId} disabled={!sizeId} onChange={(e) => changePackage(e.target.value)}><option value="">選択しない</option>{packages.map((item) => <option key={item.id} value={item.id}>{item.format ?? item.name}</option>)}</NativeSelect></Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="数量（kg）" htmlFor="quantity" error={errors?.quantityKg?.[0]}><Input id="quantity" name="quantityKg" type="number" min="0.01" max={stock?.availableWeightKg} step="0.01" disabled={!sizeId} placeholder={stock ? `上限 ${stock.availableWeightKg}` : "0"} required /></Field>
      <Field label="単価（円/kg）" htmlFor="unit-price" error={errors?.unitPriceYenPerKg?.[0]}><Input id="unit-price" name="unitPriceYenPerKg" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} disabled={!sizeId} required /></Field>
    </div>
    {stock && <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-kiwi-ink">現在の出荷可能在庫：<strong>{stock.availableWeightKg.toLocaleString("ja-JP")} kg</strong></p>}
    <div className="grid grid-cols-2 gap-3">
      <Field label="出荷日" htmlFor="shipping-date" error={errors?.shippingDate?.[0]}><Input id="shipping-date" name="shippingDate" type="date" defaultValue={defaultDate} required /></Field>
      <Field label="納品日" htmlFor="delivery-date" error={errors?.deliveryDate?.[0]}><Input id="delivery-date" name="deliveryDate" type="date" defaultValue={defaultDate} required /></Field>
    </div>
    <Field label="備考（任意）" htmlFor="notes" error={errors?.notes?.[0]}><textarea id="notes" name="notes" maxLength={500} placeholder="配送方法や申し送りなど" className={textareaClass} /></Field>
    <Button type="submit" disabled={!stock || pending} className="mt-3 h-13 w-full rounded-full text-[15px] font-bold shadow-[0_8px_20px_-6px_rgba(66,160,71,0.5)]">{pending ? "登録中…" : "出荷・販売を登録する"}</Button>
  </form>;
}

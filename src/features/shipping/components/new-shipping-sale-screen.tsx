import { BackButton } from "@/components/layout/back-button";
import { ShippingSaleForm } from "@/features/shipping/components/shipping-sale-form";
import { getShippingFormOptions } from "@/features/shipping/queries";

function todayInJst() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }

export async function NewShippingSaleScreen() {
  const options = await getShippingFormOptions();
  return <main className="flex-1 px-[7%] pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
    <header className="relative mb-6 flex h-11 items-center justify-center"><div className="absolute -left-2"><BackButton fallbackHref="/home" /></div><h1 className="text-[clamp(1.1rem,5cqw,1.35rem)] font-bold text-kiwi-ink">出荷・販売登録</h1></header>
    {options.inventory.length === 0 ? <div className="rounded-2xl border border-border bg-card/90 p-5 text-sm text-muted-foreground shadow-sm"><p className="font-bold text-kiwi-ink">出荷可能な在庫がありません</p><p className="mt-1">追熟を完了すると、品種とサイズを選べるようになります。</p></div> : <ShippingSaleForm options={options} defaultDate={todayInJst()} />}
  </main>;
}

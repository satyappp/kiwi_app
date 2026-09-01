import { KiwiBackdrop } from "@/components/layout/kiwi-backdrop";

/**
 * Operational surface — the phone-first quick-entry app used in the field
 * (収穫登録 / 選果入力 / 追熟 …). Installed as a PWA, its `start_url` is `/`.
 *
 * Provides the shared chrome: the watercolor backdrop and a centered
 * phone-width column. Individual screens supply their own header.
 *
 * `KiwiBackdrop` is a sibling of (not inside) the `@container` column — the
 * container context would otherwise trap its `position: fixed`.
 */
export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <KiwiBackdrop />
      <div className="@container relative z-0 mx-auto flex min-h-dvh w-full max-w-[440px] flex-col">
        {children}
      </div>
    </>
  );
}

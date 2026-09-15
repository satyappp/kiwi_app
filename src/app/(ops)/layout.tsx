import { KiwiBackdrop } from "@/components/layout/kiwi-backdrop";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/features/auth/server";

/**
 * Operational surface — the phone-first quick-entry app used in the field
 * (収穫登録 / 選果入力 / 追熟 …). Installed as a PWA, its `start_url` is `/home`.
 *
 * Provides the shared chrome: the watercolor backdrop and a centered
 * phone-width column. Individual screens supply their own header.
 *
 * `KiwiBackdrop` is a sibling of (not inside) the `@container` column — the
 * container context would otherwise trap its `position: fixed`.
 */
export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/home");

  return (
    <>
      <KiwiBackdrop />
      <div className="@container relative z-0 mx-auto flex min-h-dvh w-full max-w-[440px] flex-col">
        {children}
      </div>
    </>
  );
}

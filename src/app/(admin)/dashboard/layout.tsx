import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentStaff } from "@/features/auth/server";

/**
 * Management surface — the PC dashboard used in the office (収穫分析 / 在庫 /
 * 追熟中 / リマインド …). Desktop-first; a sidebar shell will live here.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/dashboard");

  return (
    <DashboardShell staffName={staff.name}>
      {children}
    </DashboardShell>
  );
}

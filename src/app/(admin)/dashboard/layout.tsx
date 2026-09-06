import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

/**
 * Management surface — the PC dashboard used in the office (収穫分析 / 在庫 /
 * 追熟中 / リマインド …). Desktop-first; a sidebar shell will live here.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  return (
    <DashboardShell staffName={profile?.display_name ?? "スタッフ"}>
      {children}
    </DashboardShell>
  );
}

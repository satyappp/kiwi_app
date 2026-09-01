import { redirect } from "next/navigation";

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
  if (!data?.claims?.sub) redirect("/login");

  return <div className="min-h-dvh bg-background">{children}</div>;
}

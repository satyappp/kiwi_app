import { redirect } from "next/navigation";

import { KiwiBackdrop } from "@/components/layout/kiwi-backdrop";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub) redirect("/");

  return (
    <>
      <KiwiBackdrop />
      <div className="relative z-0 mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-4 py-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-8">
        {children}
      </div>
    </>
  );
}

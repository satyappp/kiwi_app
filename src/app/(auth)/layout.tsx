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
      <div className="relative z-0 mx-auto flex min-h-dvh w-full max-w-[440px] items-center px-[7%] py-10">
        {children}
      </div>
    </>
  );
}

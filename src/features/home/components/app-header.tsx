import { LogOut } from "lucide-react";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { logout } from "@/features/auth";

export function AppHeader() {
  return (
    <header className="relative flex items-center justify-between px-[7%] pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[170%] bg-gradient-to-b from-kiwi-cream/90 via-kiwi-cream/55 to-transparent" />

      <MobileNavigation />

      <h1 className="relative">
        <BrandLogo priority className="w-[112px]" />
      </h1>

      <form action={logout} className="relative -mr-1.5">
        <button
          type="submit"
          aria-label="ログアウト"
          className="grid size-11 place-items-center rounded-full text-kiwi-ink active:bg-black/5"
        >
          <LogOut aria-hidden="true" className="size-[24px]" />
        </button>
      </form>
    </header>
  );
}

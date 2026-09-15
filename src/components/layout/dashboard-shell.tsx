"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

import { dashboardNavigation } from "@/components/layout/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logout } from "@/features/auth";
import { cn } from "@/lib/utils";

function DashboardNavigationLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-4 py-5">
      {dashboardNavigation.map((section) => (
        <section key={section.label} className="mb-7">
          <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.16em] text-muted-foreground/80">
            {section.label}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive = item.href
                ? pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
                : false;
              const rowClass = cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition",
                isActive
                  ? "bg-kiwi-pale/65 text-kiwi-ink shadow-[inset_3px_0_0_var(--kiwi-primary)]"
                  : "text-muted-foreground hover:bg-kiwi-pale/25 hover:text-kiwi-ink",
                item.isPending && "cursor-default opacity-60",
              );

              if (!item.href) {
                return (
                  <div key={item.label} className={rowClass} aria-disabled="true">
                    <item.icon className="size-[19px]" />
                    <span className="flex-1">{item.label}</span>
                    {item.isPending && (
                      <span className="rounded-full bg-kiwi-tan/70 px-2 py-0.5 text-[10px] font-medium">
                        準備中
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link key={item.label} href={item.href} className={rowClass}>
                  <item.icon className="size-[19px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex flex-col items-start px-6 py-6">
      <BrandLogo priority className="w-[146px]" />
      <span className="mt-1 text-[11px] text-muted-foreground">農園の毎日を、軽やかに。</span>
    </Link>
  );
}

function LogoutButton() {
  return (
    <form action={logout} className="border-t border-kiwi/10 p-4">
      <button
        type="submit"
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-muted-foreground hover:bg-kiwi-pale/25 hover:text-kiwi-ink"
      >
        <LogOut className="size-[19px]" />
        ログアウト
      </button>
    </form>
  );
}

export function DashboardShell({
  children,
  staffName,
}: {
  children: React.ReactNode;
  staffName: string;
}) {
  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_85%_0%,rgba(200,230,160,0.32),transparent_34%),linear-gradient(135deg,#fbfdf7_0%,#f2f9ef_100%)] lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-kiwi/10 bg-white/68 backdrop-blur-xl lg:flex">
        <Brand />
        <DashboardNavigationLinks />
        <LogoutButton />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-kiwi/10 bg-white/75 px-4 backdrop-blur-xl sm:px-7 lg:h-[76px] lg:px-10">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger className="grid size-10 place-items-center rounded-xl text-kiwi-ink hover:bg-kiwi-pale/30 lg:hidden" aria-label="メニューを開く">
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(86vw,310px)] gap-0 border-kiwi/10 bg-kiwi-cream p-0">
                <SheetTitle className="sr-only">管理メニュー</SheetTitle>
                <Brand />
                <DashboardNavigationLinks />
                <LogoutButton />
              </SheetContent>
            </Sheet>
            <p className="hidden text-sm text-muted-foreground sm:block">
              農園ダッシュボード
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-kiwi-pale/65 text-sm font-bold text-kiwi-ink">
              {staffName.slice(0, 1)}
            </div>
            <span className="text-sm font-bold text-kiwi-ink">{staffName}さん</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-7 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

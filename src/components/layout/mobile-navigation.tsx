"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logout } from "@/features/auth";
import { mobileNavigation } from "@/components/layout/navigation";

export function MobileNavigation() {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="メニューを開く"
        className="relative -ml-1.5 grid size-11 place-items-center rounded-full active:bg-black/5"
      >
        <Image
          src="/assets/icons/png/64/menu.png"
          alt=""
          width={26}
          height={26}
          className="size-[26px]"
        />
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(86vw,340px)] border-kiwi/10 bg-kiwi-cream p-0">
        <div className="border-b border-kiwi/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <Image src="/assets/brand/kiwi-mark.png" alt="" width={42} height={42} />
            <div>
              <SheetTitle className="text-xl font-bold text-kiwi-ink">ReFruits</SheetTitle>
              <p className="text-xs text-muted-foreground">作業メニュー</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {mobileNavigation.map((section) => (
            <section key={section.label} className="mb-6">
              <p className="mb-2 px-3 text-xs font-bold tracking-[0.14em] text-muted-foreground">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) =>
                  item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold text-kiwi-ink transition hover:bg-white active:bg-white"
                    >
                      <item.icon className="size-5 text-kiwi" />
                      {item.label}
                    </Link>
                  ) : (
                    <div
                      key={item.label}
                      aria-disabled="true"
                      className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold text-muted-foreground/65"
                    >
                      <item.icon className="size-5" />
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded-full bg-kiwi-tan/70 px-2 py-0.5 text-[10px]">準備中</span>
                    </div>
                  ),
                )}
              </div>
            </section>
          ))}
        </nav>

        <form action={logout} className="border-t border-kiwi/10 p-4">
          <button
            type="submit"
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 font-bold text-muted-foreground hover:bg-white"
          >
            <LogOut className="size-5" />
            ログアウト
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import Link from "next/link";
import {
  ChevronDown,
  ClipboardCheck,
  FileText,
  Plus,
  Sprout,
  Timer,
  Truck,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const activeActions = [
  { label: "収穫登録", href: "/harvest/new", icon: Sprout },
  { label: "選果登録", href: "/sorting/new", icon: ClipboardCheck },
  { label: "追熟開始", href: "/ripening/new", icon: Timer },
];

const pendingActions = [
  { label: "出荷処理", icon: Truck },
  { label: "納品書作成", icon: FileText },
];

export function DashboardQuickActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#557f3e] px-5 text-sm font-bold text-white shadow-[0_12px_30px_-12px_rgba(54,93,41,.65)] outline-none transition hover:bg-[#466d33] focus-visible:ring-2 focus-visible:ring-[#557f3e]/40 data-popup-open:bg-[#466d33]">
        <Plus className="size-5" />
        作業を登録
        <ChevronDown className="size-4 opacity-80 transition-transform group-data-popup-open:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">登録する作業を選択</DropdownMenuLabel>
          {activeActions.map((action) => (
            <DropdownMenuItem
              key={action.href}
              render={<Link href={action.href} />}
              className="cursor-pointer gap-3 rounded-lg px-2 py-2.5 font-medium"
            >
              <action.icon className="size-4 text-kiwi" />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {pendingActions.map((action) => (
            <DropdownMenuItem key={action.label} disabled className="gap-3 rounded-lg px-2 py-2.5">
              <action.icon className="size-4" />
              <span>{action.label}</span>
              <span className="ml-auto text-[10px] font-bold text-muted-foreground">準備中</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

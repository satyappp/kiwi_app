import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Package,
  Settings,
  Snowflake,
  Sprout,
  Timer,
  Truck,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  isPending?: boolean;
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

export const dashboardNavigation: NavigationSection[] = [
  {
    label: "メイン",
    items: [
      { label: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
      { label: "収穫データ", href: "/dashboard/harvest", icon: Sprout },
      { label: "選果管理", icon: ClipboardList, isPending: true },
      { label: "追熟管理", icon: Timer, isPending: true },
      { label: "冷蔵・在庫", icon: Snowflake, isPending: true },
      { label: "出荷管理", icon: Truck, isPending: true },
    ],
  },
  {
    label: "帳票",
    items: [
      { label: "納品書作成", icon: FileText, isPending: true },
      { label: "CSV出力", icon: Package, isPending: true },
    ],
  },
  {
    label: "管理",
    items: [{ label: "設定", icon: Settings, isPending: true }],
  },
];

export const mobileNavigation: NavigationSection[] = [
  {
    label: "作業",
    items: [
      { label: "ホーム", href: "/", icon: Home },
      { label: "収穫を記録", href: "/harvest/new", icon: Sprout },
      { label: "選果を入力", href: "/sorting/new", icon: ClipboardList },
      { label: "追熟を開始", href: "/ripening/new", icon: Timer },
    ],
  },
  {
    label: "確認",
    items: [
      { label: "収穫履歴", href: "/harvest", icon: ClipboardList },
      { label: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
];

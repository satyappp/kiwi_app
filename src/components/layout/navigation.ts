import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
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
      { label: "選果データ", href: "/dashboard/sorting", icon: ClipboardList },
      { label: "追熟管理", href: "/dashboard/ripening", icon: Timer },
      { label: "在庫確認", href: "/dashboard/inventory", icon: Snowflake },
      { label: "出荷データ", href: "/dashboard/shipping", icon: Truck },
    ],
  },
  {
    label: "帳票",
    items: [
      { label: "納品書作成", href: "/dashboard/delivery-notes", icon: FileText },
    ],
  },
];

export const mobileNavigation: NavigationSection[] = [
  {
    label: "作業",
    items: [
      { label: "ホーム", href: "/home", icon: Home },
      { label: "収穫を記録", href: "/harvest/new", icon: Sprout },
      { label: "選果を入力", href: "/sorting/new", icon: ClipboardList },
      { label: "追熟を開始", href: "/ripening/new", icon: Timer },
      { label: "在庫確認", href: "/inventory", icon: Snowflake },
      { label: "出荷処理", href: "/shipping/new", icon: Truck },
      { label: "納品書作成", href: "/dashboard/delivery-notes", icon: FileText },
    ],
  },
  {
    label: "確認",
    items: [
      { label: "収穫履歴", href: "/harvest", icon: ClipboardList },
    ],
  },
];

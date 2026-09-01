import type { Metadata } from "next";
import "./globals.css";
import { Noto_Sans_JP } from "next/font/google";
import { cn } from "@/lib/utils";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "キウイ農園",
  description: "収穫から出荷までをつなぐ、キウイ農園の管理アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={cn("font-sans", notoSansJP.variable)}>
      <body className="bg-kiwi-cream text-foreground" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

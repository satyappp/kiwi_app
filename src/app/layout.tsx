import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Noto_Sans_JP } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { cn } from "@/lib/utils";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReFruits",
  description: "収穫から出荷までをつなぐ、ReFruits農園管理アプリ",
  applicationName: "ReFruits",
  appleWebApp: {
    capable: true,
    title: "ReFruits",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4caf50",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={cn("font-sans", notoSansJP.variable)}>
      <body className="bg-kiwi-cream text-foreground" suppressHydrationWarning>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

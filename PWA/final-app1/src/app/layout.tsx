import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PWAProvider } from "@/components/providers/pwa-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/react";
import { WebVitals } from "@/components/providers/web-vitals";
import "./globals.css";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "rboyrpltnaxcbqhrimwr.supabase.co";

export const metadata: Metadata = {
  title: {
    default: "在庫注文管理システム",
    template: "%s | 在庫管理",
  },
  description: "商品の在庫管理、売上管理を一元化するPWAアプリケーション",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "在庫管理",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192x192.svg",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://inventory-management-pwa.vercel.app"),
  openGraph: {
    title: "在庫注文管理システム",
    description: "商品の在庫管理、売上管理を一元化するPWAアプリケーション",
    type: "website",
    locale: "ja_JP",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="dns-prefetch" href={`https://${supabaseHost}`} />
        <link rel="preconnect" href={`https://${supabaseHost}`} crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <ToastProvider>
          <AuthProvider>
            <PWAProvider>
              {children}
            </PWAProvider>
          </AuthProvider>
        </ToastProvider>
        <Analytics />
        <WebVitals />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PWAProvider } from "@/components/providers/pwa-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "在庫注文管理システム",
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
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body className="antialiased">
        <ToastProvider>
          <AuthProvider>
            <PWAProvider>
              {children}
            </PWAProvider>
          </AuthProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}

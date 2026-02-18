"use client";

import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { OfflineBanner } from "./offline-banner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <OfflineBanner />
      <Header />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "ホーム", href: "/", icon: LayoutDashboard },
  { name: "在庫", href: "/inventory", icon: Package },
  { name: "注文", href: "/orders", icon: ShoppingCart },
  { name: "レポート", href: "/reports", icon: BarChart3 },
  { name: "設定", href: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors min-w-0",
                isActive
                  ? "text-gray-900"
                  : "text-gray-400 active:text-gray-600"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 mb-0.5",
                  isActive ? "text-gray-800" : "text-gray-400"
                )}
              />
              <span
                className={cn(
                  "text-[10px] leading-tight truncate",
                  isActive ? "font-bold" : "font-medium"
                )}
              >
                {item.name}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 bg-gray-800 rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

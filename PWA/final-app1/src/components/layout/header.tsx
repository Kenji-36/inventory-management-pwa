"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut,
  Menu,
  X,
  Boxes,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const navigation = [
  { name: "ダッシュボード", href: "/", icon: LayoutDashboard },
  { name: "在庫管理", href: "/inventory", icon: Package },
  { name: "注文管理", href: "/orders", icon: ShoppingCart },
  { name: "設定", href: "/settings", icon: Settings },
];

// 管理者のみ表示するナビゲーション
const adminNavigation = [
  { name: "管理者", href: "/admin", icon: Shield },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // API経由でユーザーのロールを取得（RLS制限を回避）
  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsAdmin(data.user.isAdmin === true);
        }
      }
    } catch {
      // エラー時は管理者メニューを非表示
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // 初期ユーザー取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchUserRole();
      }
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole();
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Supabaseが自動的にCookieを削除
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex-shrink-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gray-600 flex items-center justify-center shadow-md group-hover:bg-gray-700 transition-all">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gray-800">
                在庫管理
              </span>
              <span className="text-xs text-gray-400 block -mt-0.5">Inventory System</span>
            </div>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center bg-gray-100/80 rounded-2xl p-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 mr-2 transition-colors",
                    isActive ? "text-gray-700" : "text-gray-400"
                  )} />
                  {item.name}
                </Link>
              );
            })}
            {/* 管理者のみ表示 */}
            {isAdmin && adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-amber-100 text-amber-800 shadow-sm"
                      : "text-amber-600 hover:text-amber-800"
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 mr-2 transition-colors",
                    isActive ? "text-amber-700" : "text-amber-400"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* ユーザーメニュー */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-3 bg-gray-100/80 rounded-2xl pl-2 pr-4 py-1.5">
                {user.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.name || user.email || "User"}
                    className="h-8 w-8 rounded-xl ring-2 ring-white"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user.user_metadata?.name || user.email}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden sm:flex rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>

            {/* モバイルメニューボタン */}
            <button
              type="button"
              className="md:hidden w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* モバイルナビゲーション */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 fade-in">
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-gray-100 text-gray-800"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 mr-3",
                      isActive ? "text-gray-700" : "text-gray-400"
                    )} />
                    {item.name}
                  </Link>
                );
              })}
              {/* 管理者のみ表示 */}
              {isAdmin && adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-amber-100 text-amber-800"
                        : "text-amber-600 hover:bg-amber-50"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 mr-3",
                      isActive ? "text-amber-700" : "text-amber-400"
                    )} />
                    {item.name}
                  </Link>
                );
              })}
              <hr className="my-2 border-gray-100" />
              {user && (
                <div className="flex items-center px-4 py-3 gap-3">
                  {user.user_metadata?.avatar_url && (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.name || user.email || "User"}
                      className="h-10 w-10 rounded-xl"
                    />
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-900 block">
                      {user.user_metadata?.name || user.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user.email}
                    </span>
                  </div>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 mt-1"
              >
                <LogOut className="h-5 w-5 mr-3" />
                ログアウト
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

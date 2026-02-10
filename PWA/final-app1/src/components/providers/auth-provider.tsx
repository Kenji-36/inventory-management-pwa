"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const redirecting = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      setUser(session?.user ?? null);
      setChecked(true);

      // 未認証 + 保護ページ → /login へ
      if (!session && window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setChecked(true);

        // ログイン成功 → /login にいるなら / へ遷移
        if (event === "SIGNED_IN" && currentUser && !redirecting.current) {
          if (window.location.pathname === "/login") {
            redirecting.current = true;
            window.location.href = "/";
          }
        }

        // ログアウト → /login へ
        if (event === "SIGNED_OUT") {
          if (window.location.pathname !== "/login") {
            window.location.replace("/login");
          }
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []); // マウント時 1 回

  // --- レンダリング ---

  // ログインページは無条件で表示
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // チェック完了前 → ローディング
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // 未認証 → null（window.location.replace が走っている）
  if (!user) {
    return null;
  }

  // 認証済み → 表示
  return <>{children}</>;
}

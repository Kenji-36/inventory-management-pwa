import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * ミドルウェア
 * - APIルートの認証保護（401を返す）
 * - ページレベルのリダイレクトはAuthProvider（クライアント側）が担当
 * - セッションCookieのリフレッシュ
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイル・公開パスは常に許可
  const isPublicPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/offline";

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 認証関連パスは常に許可
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // ログインページは常に許可
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // ページリクエスト（非API）はそのまま通す
  // ページレベルの認証チェックはAuthProvider（クライアント側）が担当
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // === ここ以降はAPIルートのみ ===

  // レスポンスを作成
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Supabaseクライアントを作成
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // APIルート: 認証チェック
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "認証が必要です" },
      { status: 401 }
    );
  }

  return response;
}

// ルートマッチャー
export const config = {
  matcher: [
    // APIルートのみマッチ（認証関連は除外）
    "/api/((?!auth).*)",
  ],
};

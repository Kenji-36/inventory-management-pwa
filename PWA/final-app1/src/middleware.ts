import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  // 認証関連パスは常に許可（OAuthコールバック含む）
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // ログインページは常に許可（認証チェック不要）
  if (pathname === "/login") {
    return NextResponse.next();
  }

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

  // getUser()でJWTを検証（getSession()より安全）
  const { data: { user }, error } = await supabase.auth.getUser();

  // APIルートの場合は401を返す（リダイレクトではなく）
  if (pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }
    return response;
  }

  // 未ログインで保護されたページにアクセス → ログインへリダイレクト
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// 認証が必要なルートを指定
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのルートにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico (ファビコン)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

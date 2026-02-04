import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // 認証不要なパス
  const publicPaths = ["/login", "/api/auth"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // 静的ファイルのパス
  const isStaticPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json";

  // 静的ファイルは常に許可
  if (isStaticPath) {
    return NextResponse.next();
  }

  // 未ログインで保護されたページにアクセス
  if (!session && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済みでログインページにアクセス
  if (session && pathname === "/login") {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
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

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * OAuth認証コールバック
 * PKCEフロー: Supabaseからのリダイレクトでcodeパラメータを受け取り、セッションを確立
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    // リダイレクト先のレスポンスを先に作成
    const redirectUrl = new URL(next, requestUrl.origin);
    const response = NextResponse.redirect(redirectUrl);

    // Supabaseクライアントを作成（リダイレクトレスポンスにCookieを設定）
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // リダイレクトレスポンスに直接Cookieを設定
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // PKCEコードをセッションに交換
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('認証コールバックエラー:', error.message);
      // エラー時はログインページにリダイレクト
      return NextResponse.redirect(
        new URL('/login?error=auth_callback_error', requestUrl.origin)
      );
    }

    // セッション確立成功 → ダッシュボードへリダイレクト（Cookieが設定済み）
    return response;
  }

  // codeがない場合はログインページへ
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

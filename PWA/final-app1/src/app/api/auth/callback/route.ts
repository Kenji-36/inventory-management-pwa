import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Cookieの設定に失敗しても続行
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete(name);
            } catch (error) {
              // Cookieの削除に失敗しても続行
            }
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('認証コールバックエラー:', error);
      return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin));
    }

    if (data.session) {
      // セッションが正常に作成された場合、ダッシュボードにリダイレクト
      const response = NextResponse.redirect(new URL('/', requestUrl.origin));
      return response;
    }
  }

  // リダイレクト先URL
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}

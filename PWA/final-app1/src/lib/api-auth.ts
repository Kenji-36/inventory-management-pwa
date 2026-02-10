/**
 * API認証・認可ヘルパー（Supabase Auth版）
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * APIルートでセッションを検証（Supabase Auth）
 */
export async function validateSession() {
  try {
    const cookieStore = await cookies();
    
    // Supabase Server Clientを作成
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

    // Supabaseでセッションとユーザーを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return {
        valid: false as const,
        response: NextResponse.json(
          { success: false, error: "認証が必要です" },
          { status: 401 }
        ),
      };
    }

    const user = session.user;
    
    return {
      valid: true as const,
      user: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || '',
        image: user.user_metadata?.avatar_url || null,
      },
    };
  } catch (error) {
    console.error('認証エラー:', error);
    return {
      valid: false as const,
      response: NextResponse.json(
        { success: false, error: "認証エラーが発生しました" },
        { status: 401 }
      ),
    };
  }
}

/**
 * 管理者権限を検証（将来の拡張用）
 */
export async function validateAdminPermission() {
  const sessionResult = await validateSession();
  
  if (!sessionResult.valid) {
    return sessionResult;
  }
  
  // TODO: ユーザマスタから権限を取得して検証
  // 現在は全ユーザーを管理者として扱う
  
  return sessionResult;
}

/**
 * レート制限チェック（簡易版）
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    // 新しいウィンドウを開始
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }
  
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }
  
  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * レート制限エラーレスポンス
 */
export function rateLimitResponse(resetTime: number) {
  return NextResponse.json(
    {
      success: false,
      error: "リクエスト制限を超えました。しばらくしてから再試行してください。",
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
      },
    }
  );
}

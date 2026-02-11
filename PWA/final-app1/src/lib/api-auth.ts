/**
 * API認証・認可ヘルパー（Supabase Auth版）
 * セキュリティ強化版
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * APIルートでセッションを検証（Supabase Auth）
 * getUser()を使用してJWTをサーバー側で検証（getSession()より安全）
 */
export async function validateSession() {
  try {
    const cookieStore = await cookies();
    
    // Supabase Server Clientを作成（anon keyで、RLS有効）
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

    // getUser()でJWTをSupabaseサーバーに送信して検証（getSession()より安全）
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        valid: false as const,
        response: NextResponse.json(
          { success: false, error: "認証が必要です" },
          { status: 401 }
        ),
      };
    }
    
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
 * 管理者権限を検証
 * usersテーブルのroleカラムを確認して管理者かどうかを判定
 */
export async function validateAdminPermission() {
  const sessionResult = await validateSession();
  
  if (!sessionResult.valid) {
    return sessionResult;
  }

  try {
    // usersテーブルからroleを取得
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', sessionResult.user.id)
      .single();

    if (userError || !userData) {
      // usersテーブルにレコードがない場合はデフォルトで一般ユーザー扱い
      return {
        valid: true as const,
        user: sessionResult.user,
        isAdmin: false,
      };
    }

    return {
      valid: true as const,
      user: sessionResult.user,
      isAdmin: userData.role === 'admin',
    };
  } catch (error) {
    console.error('権限チェックエラー:', error);
    // エラー時は一般ユーザー扱い（安全側に倒す）
    return {
      valid: true as const,
      user: sessionResult.user,
      isAdmin: false,
    };
  }
}

/**
 * 認証を強制するヘルパー
 * 認証失敗時に401レスポンスを返す
 */
export async function requireAuth() {
  const authResult = await validateSession();
  if (!authResult.valid) {
    return { authenticated: false as const, response: authResult.response };
  }
  return { authenticated: true as const, user: authResult.user };
}

/**
 * 管理者認証を強制するヘルパー
 * 管理者でない場合は403レスポンスを返す
 */
export async function requireAdmin() {
  const authResult = await validateAdminPermission();
  if (!authResult.valid) {
    return { authenticated: false as const, response: authResult.response };
  }
  if (!authResult.isAdmin) {
    return {
      authenticated: false as const,
      response: NextResponse.json(
        { success: false, error: "管理者権限が必要です" },
        { status: 403 }
      ),
    };
  }
  return { authenticated: true as const, user: authResult.user };
}

/**
 * レート制限チェック（簡易版）
 * 注意: サーバーレス環境ではインスタンスごとにリセットされるため、
 * 本番環境ではRedis等の外部ストアを推奨
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

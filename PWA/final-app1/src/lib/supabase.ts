/**
 * Supabase クライアント（ブラウザ用）
 * @supabase/ssr の createBrowserClient を使用
 * セッションをCookieで管理（サーバーサイドと共有可能）
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let _client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (_client) return _client;

  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return _client;
}

/**
 * ブラウザ用Supabaseクライアント
 * セッションはCookieに保存され、サーバーサイド（API Routes/Middleware）と共有される
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});

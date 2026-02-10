/**
 * Supabase クライアント（ブラウザ用）
 * - クライアントサイド専用（localStorageにセッションを永続化）
 * - サーバーサイドでは空のスタブを返す
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let _client: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  _client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== "undefined",   // サーバーでは保存しない
      autoRefreshToken: typeof window !== "undefined",
      detectSessionInUrl: typeof window !== "undefined",
      flowType: "implicit",
    },
  });

  return _client;
}

/**
 * ブラウザ/サーバー両方で安全に import できるが、
 * セッション永続化はブラウザでのみ有効
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});

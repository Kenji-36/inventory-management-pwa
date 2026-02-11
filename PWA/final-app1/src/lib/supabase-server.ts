/**
 * Supabase サーバークライアント（API Routes / Server Components用）
 * サーバーサイドで使用するSupabaseクライアント
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * サーバーサイド用Supabaseクライアントを取得
 * Service Role Keyを使用するため、RLSをバイパスできる
 * 
 * 注意: このクライアントは強力な権限を持つため、
 * サーバーサイドのみで使用し、クライアントに公開しないこと
 */
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を確認してください。'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 便利なエクスポート（遅延評価）
 * eslint-disable-next-line @typescript-eslint/no-explicit-any
 */
let _supabaseServer: any = null;

export const supabaseServer: any = new Proxy({}, {
  get(_target, prop) {
    if (!_supabaseServer) {
      _supabaseServer = getSupabaseServerClient();
    }
    return _supabaseServer[prop];
  },
});

/**
 * 監査ログ記録ヘルパー
 * 
 * ユーザーの操作をaudit_logsテーブルに記録します。
 * Service Role Key を使用して、RLSをバイパスして書き込みます。
 */

import { supabaseServer } from "@/lib/supabase-server";

export type AuditAction = 
  | 'create'       // レコード作成
  | 'update'       // レコード更新
  | 'delete'       // レコード削除
  | 'login'        // ログイン
  | 'logout'       // ログアウト
  | 'role_change'  // ロール変更
  | 'csv_import'   // CSVインポート
  | 'csv_export';  // CSVエクスポート

export interface AuditLogEntry {
  userId?: string | null;
  userEmail?: string | null;
  action: AuditAction;
  targetTable?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * 監査ログを記録する
 * 
 * @param entry - 監査ログエントリ
 * @returns 成功したかどうか
 * 
 * @example
 * ```ts
 * await recordAuditLog({
 *   userId: user.id,
 *   userEmail: user.email,
 *   action: 'create',
 *   targetTable: 'products',
 *   targetId: '123',
 *   details: { name: '新商品', price: 1000 }
 * });
 * ```
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from('audit_logs')
      .insert({
        user_id: entry.userId || null,
        user_email: entry.userEmail || null,
        action: entry.action,
        target_table: entry.targetTable || null,
        target_id: entry.targetId || null,
        details: entry.details || null,
        ip_address: entry.ipAddress || null,
      });

    if (error) {
      console.error('監査ログ記録エラー:', error);
      return false;
    }

    return true;
  } catch (error) {
    // 監査ログの記録失敗はアプリケーションの動作を止めない
    console.error('監査ログ記録例外:', error);
    return false;
  }
}

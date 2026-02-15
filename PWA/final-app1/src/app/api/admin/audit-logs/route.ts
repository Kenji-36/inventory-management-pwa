/**
 * 管理者用 監査ログAPI
 * 
 * GET /api/admin/audit-logs - 監査ログ一覧取得（管理者のみ）
 * 
 * クエリパラメータ:
 *   - limit: 取得件数（デフォルト: 50、最大: 200）
 *   - offset: オフセット（ページネーション用）
 *   - action: アクションでフィルタ（例: 'create', 'role_change'）
 *   - target_table: テーブルでフィルタ（例: 'products', 'users'）
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  // 管理者権限チェック
  const authResult = await requireAdmin();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action');
    const targetTable = searchParams.get('target_table');

    // クエリを構築
    let query = supabaseServer
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // フィルタを適用
    if (action) {
      query = query.eq('action', action);
    }
    if (targetTable) {
      query = query.eq('target_table', targetTable);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('監査ログ取得エラー:', error);
      return NextResponse.json(
        { success: false, error: '監査ログの取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: logs,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('監査ログ取得例外:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

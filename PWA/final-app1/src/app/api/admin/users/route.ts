/**
 * 管理者用 ユーザー管理API
 * 
 * GET  /api/admin/users       - ユーザー一覧取得（管理者のみ）
 * PUT  /api/admin/users       - ユーザーロール更新（管理者のみ）
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { recordAuditLog } from "@/lib/audit-log";

/**
 * GET: ユーザー一覧を取得
 */
export async function GET() {
  // 管理者権限チェック
  const authResult = await requireAdmin();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { data: users, error } = await supabaseServer
      .from('users')
      .select('id, email, name, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('ユーザー一覧取得エラー:', error);
      return NextResponse.json(
        { success: false, error: 'ユーザー一覧の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: users,
      total: users?.length || 0,
    });
  } catch (error) {
    console.error('ユーザー一覧取得例外:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * PUT: ユーザーのロールを更新
 * 
 * Body: { userId: string, role: 'admin' | 'user' }
 */
export async function PUT(request: NextRequest) {
  // 管理者権限チェック
  const authResult = await requireAdmin();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { userId, role } = body;

    // バリデーション
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'ロールは "admin" または "user" のいずれかを指定してください' },
        { status: 400 }
      );
    }

    // 自分自身のロールを変更できないようにする（安全対策）
    if (userId === authResult.user.id) {
      return NextResponse.json(
        { success: false, error: '自分自身のロールは変更できません' },
        { status: 400 }
      );
    }

    // 変更前のロールを取得
    const { data: currentUser, error: fetchError } = await supabaseServer
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // ロールを更新
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('ロール更新エラー:', updateError);
      return NextResponse.json(
        { success: false, error: 'ロールの更新に失敗しました' },
        { status: 500 }
      );
    }

    // 監査ログに記録
    await recordAuditLog({
      userId: authResult.user.id,
      userEmail: authResult.user.email,
      action: 'role_change',
      targetTable: 'users',
      targetId: userId,
      details: {
        targetEmail: currentUser.email,
        previousRole: currentUser.role,
        newRole: role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `ユーザーのロールを "${role}" に変更しました`,
    });
  } catch (error) {
    console.error('ロール更新例外:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

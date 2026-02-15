/**
 * 現在のユーザー情報とロールを返すAPI
 * 
 * GET /api/auth/me
 * 
 * ヘッダーの管理者メニュー表示判定などに使用。
 * Service Role Keyを使ってusersテーブルを参照するため、
 * クライアント側のRLS制限を回避できる。
 */

import { NextResponse } from "next/server";
import { validateAdminPermission } from "@/lib/api-auth";

export async function GET() {
  const auth = await validateAdminPermission();

  if (!auth.valid) {
    return auth.response;
  }

  return NextResponse.json({
    success: true,
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
      isAdmin: auth.isAdmin,
    },
  });
}

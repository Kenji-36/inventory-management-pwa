import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/api-auth";

/**
 * デバッグ用: 登録済みJANコード一覧
 * GET /api/debug/jan-codes
 */
export async function GET() {
  // 本番環境では404を返す
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 開発環境では管理者権限が必要
  const adminAuth = await requireAdmin();
  if (!adminAuth.authenticated) {
    return adminAuth.response;
  }

  try {
    const { data: products, error } = await supabaseServer
      .from('products')
      .select('id, name, jan_code, product_code, size')
      .order('id', { ascending: true });

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: products?.length || 0,
      products: products,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { validateStockQuantity } from "@/lib/validation";

/**
 * 在庫情報を取得
 * GET /api/stock
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }
  // レート制限チェック
  const rateLimit = await checkRateLimit(`stock-get-${auth.user.email}`, 60);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  try {
    // Supabaseから在庫情報を取得
    const { data: stockData, error: stockError } = await supabaseServer
      .from('stock')
      .select('*')
      .order('id', { ascending: true });

    if (stockError) {
      throw stockError;
    }

    // 型変換（Supabase → 既存の型）
    const stocks = (stockData || []).map((s: any) => ({
      在庫ID: s.id,
      商品ID: s.product_id,
      在庫数: s.quantity,
      最終入庫日: s.last_stocked_date || "",
      作成日: s.created_at,
      更新日: s.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: stocks,
      count: stocks.length,
    });
  } catch (error) {
    const { errorResponse } = await import("@/lib/error-handler");
    return errorResponse(error, "在庫情報の取得に失敗しました");
  }
}

/**
 * 在庫数を更新
 * PUT /api/stock
 * 
 * Body:
 * - productId: 商品ID
 * - quantity: 新しい在庫数 または 増減値
 * - mode: "set" (絶対値設定) または "add" (増減)
 */
export async function PUT(request: Request) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }
  // レート制限チェック（更新は厳しめに制限）
  const rateLimit = await checkRateLimit(`stock-put-${auth.user.email}`, 30);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  try {
    const body = await request.json();
    const { productId, quantity, mode = "set" } = body;

    // 入力値検証
    if (!productId || typeof productId !== "number") {
      return NextResponse.json(
        { success: false, error: "productId は数値で指定してください" },
        { status: 400 }
      );
    }

    if (quantity === undefined || typeof quantity !== "number") {
      return NextResponse.json(
        { success: false, error: "quantity は数値で指定してください" },
        { status: 400 }
      );
    }

    if (mode !== "set" && mode !== "add") {
      return NextResponse.json(
        { success: false, error: "mode は 'set' または 'add' である必要があります" },
        { status: 400 }
      );
    }

    // 現在の在庫を取得
    const { data: currentStock, error: fetchError } = await supabaseServer
      .from('stock')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (fetchError || !currentStock) {
      return NextResponse.json(
        { success: false, error: "在庫情報が見つかりません" },
        { status: 404 }
      );
    }

    // 新しい在庫数を計算
    const currentQuantity = currentStock.quantity;
    const newQuantity =
      mode === "add" ? currentQuantity + quantity : quantity;

    // 在庫数の検証
    const validation = validateStockQuantity(newQuantity);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    console.log(`📦 在庫更新: 商品ID=${productId}, ${currentQuantity} → ${newQuantity} (mode=${mode})`);

    // Supabaseで在庫を更新
    const { data: updatedStock, error: updateError } = await supabaseServer
      .from('stock')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', productId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 在庫更新失敗:', updateError);
      throw updateError;
    }

    console.log(`✅ 在庫更新成功: 商品ID=${productId}, 新在庫数=${updatedStock.quantity}`);

    return NextResponse.json({
      success: true,
      data: {
        productId,
        previousQuantity: currentQuantity,
        newQuantity,
        updatedAt: updatedStock.updated_at,
      },
    });
  } catch (error) {
    const { errorResponse } = await import("@/lib/error-handler");
    return errorResponse(error, "在庫の更新に失敗しました");
  }
}

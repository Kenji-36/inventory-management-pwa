/**
 * 入出庫履歴API
 * 
 * GET  /api/stock-movements - 入出庫履歴一覧取得
 * POST /api/stock-movements - 手動入出庫の記録
 * 
 * クエリパラメータ (GET):
 *   - product_id: 商品IDでフィルタ
 *   - movement_type: 種類でフィルタ ('in', 'out', 'adjust', 'order')
 *   - limit: 取得件数（デフォルト: 50、最大: 200）
 *   - offset: オフセット
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { supabaseServer } from "@/lib/supabase-server";
import { recordStockMovement } from "@/lib/stock-movement";
import { recordAuditLog } from "@/lib/audit-log";

/**
 * GET: 入出庫履歴一覧を取得
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const rateLimit = await checkRateLimit(`stock-movements-get-${auth.user.email}`, 30);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetTime);

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const movementType = searchParams.get('movement_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseServer
      .from('stock_movements')
      .select('*, products(name, product_code, jan_code)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productId) {
      query = query.eq('product_id', parseInt(productId));
    }
    if (movementType) {
      query = query.eq('movement_type', movementType);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('入出庫履歴取得エラー:', error);
      return NextResponse.json(
        { success: false, error: '入出庫履歴の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('入出庫履歴取得例外:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * POST: 手動入出庫を記録
 * 
 * Body: {
 *   productId: number,
 *   movementType: 'in' | 'out' | 'adjust',
 *   quantity: number,  // 正の数（入庫量 or 出庫量 or 調整後の絶対値）
 *   reason: string
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const rateLimit = await checkRateLimit(`stock-movements-post-${auth.user.email}`, 20);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetTime);

  try {
    const body = await request.json();
    const { productId, movementType, quantity, reason } = body;

    // バリデーション
    if (!productId || typeof productId !== 'number') {
      return NextResponse.json(
        { success: false, error: '商品IDが必要です' },
        { status: 400 }
      );
    }
    if (!['in', 'out', 'adjust'].includes(movementType)) {
      return NextResponse.json(
        { success: false, error: '種類は in, out, adjust のいずれかを指定してください' },
        { status: 400 }
      );
    }
    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { success: false, error: '数量は0以上の数値を指定してください' },
        { status: 400 }
      );
    }

    // 現在の在庫を取得
    const { data: currentStock, error: stockError } = await supabaseServer
      .from('stock')
      .select('quantity')
      .eq('product_id', productId)
      .single();

    if (stockError || !currentStock) {
      return NextResponse.json(
        { success: false, error: '在庫情報が見つかりません' },
        { status: 404 }
      );
    }

    const previousQuantity = currentStock.quantity;
    let newQuantity: number;
    let movementQuantity: number;

    switch (movementType) {
      case 'in':
        newQuantity = previousQuantity + quantity;
        movementQuantity = quantity;
        break;
      case 'out':
        newQuantity = Math.max(0, previousQuantity - quantity);
        movementQuantity = -Math.min(quantity, previousQuantity);
        break;
      case 'adjust':
        newQuantity = quantity; // 棚卸調整：絶対値で設定
        movementQuantity = quantity - previousQuantity;
        break;
      default:
        return NextResponse.json(
          { success: false, error: '不正な移動種類です' },
          { status: 400 }
        );
    }

    // 在庫を更新
    const { error: updateError } = await supabaseServer
      .from('stock')
      .update({ 
        quantity: newQuantity, 
        updated_at: new Date().toISOString(),
        last_stocked_date: movementType === 'in' ? new Date().toISOString().split('T')[0] : undefined,
      })
      .eq('product_id', productId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: '在庫の更新に失敗しました' },
        { status: 500 }
      );
    }

    // 入出庫履歴を記録
    await recordStockMovement({
      productId,
      userId: auth.user.id,
      userEmail: auth.user.email,
      movementType,
      quantity: movementQuantity,
      previousQuantity,
      newQuantity,
      reason: reason || null,
    });

    // 監査ログにも記録
    await recordAuditLog({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: movementType === 'in' ? 'create' : 'update',
      targetTable: 'stock',
      targetId: String(productId),
      details: { movementType, previousQuantity, newQuantity, reason },
    });

    return NextResponse.json({
      success: true,
      data: {
        productId,
        movementType,
        previousQuantity,
        newQuantity,
        quantity: movementQuantity,
      },
    });
  } catch (error) {
    console.error('入出庫記録例外:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

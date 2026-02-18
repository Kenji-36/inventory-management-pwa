import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { validateOrderQuantity, validatePrice } from "@/lib/validation";
import { recordAuditLog } from "@/lib/audit-log";
import { recordStockMovementBatch, type StockMovementEntry } from "@/lib/stock-movement";
import type { Order } from "@/types";

/**
 * 注文一覧を取得
 * GET /api/orders
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    // レート制限チェック
    const rateLimit = await checkRateLimit(`orders-get-${auth.user.email}`, 60);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetTime);
    }
    // Supabaseから注文情報を取得
    const { data: ordersData, error: ordersError } = await supabaseServer
      .from('orders')
      .select('id, item_count, total_price_excluding_tax, total_price_including_tax, order_date')
      .order('order_date', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    // 型変換（Supabase → 既存の型）
    const orders: Order[] = (ordersData || []).map((o: any) => ({
      注文ID: o.id,
      商品数: o.item_count,
      "注文金額(税抜)": o.total_price_excluding_tax,
      "注文金額(税込)": o.total_price_including_tax,
      注文日: o.order_date,
    }));

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    const { errorResponse } = await import("@/lib/error-handler");
    return errorResponse(error, "注文情報の取得に失敗しました");
  }
}

/**
 * 新規注文を作成
 * POST /api/orders
 * 
 * Body:
 * - items: Array<{ productId, quantity, unitPriceExclTax, unitPriceInclTax }>
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }
  // レート制限チェック（注文作成は厳しめに制限）
  const rateLimit = await checkRateLimit(`orders-post-${auth.user.email}`, 10);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  try {
    const body = await request.json();
    const { items } = body;

    // 基本検証
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "注文商品が指定されていません" },
        { status: 400 }
      );
    }

    // 注文商品数の上限チェック
    if (items.length > 100) {
      return NextResponse.json(
        { success: false, error: "注文商品数が多すぎます（最大100件）" },
        { status: 400 }
      );
    }

    // 各商品の検証
    const validationErrors: string[] = [];
    items.forEach((item: any, index: number) => {
      if (!item.productId || typeof item.productId !== "number") {
        validationErrors.push(`商品${index + 1}: productId が不正です`);
      }
      
      const qtyCheck = validateOrderQuantity(item.quantity);
      if (!qtyCheck.valid) {
        validationErrors.push(`商品${index + 1}: ${qtyCheck.error}`);
      }
      
      const priceExclCheck = validatePrice(item.unitPriceExclTax);
      if (!priceExclCheck.valid) {
        validationErrors.push(`商品${index + 1}: 税抜価格が不正です`);
      }
      
      const priceInclCheck = validatePrice(item.unitPriceInclTax);
      if (!priceInclCheck.valid) {
        validationErrors.push(`商品${index + 1}: 税込価格が不正です`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: "入力値エラー", details: validationErrors },
        { status: 400 }
      );
    }

    // 注文詳細を作成
    let totalQuantity = 0;
    let totalExclTax = 0;
    let totalInclTax = 0;

    items.forEach((item: {
      productId: number;
      quantity: number;
      unitPriceExclTax: number;
      unitPriceInclTax: number;
    }) => {
      const subtotalExclTax = item.quantity * item.unitPriceExclTax;
      const subtotalInclTax = item.quantity * item.unitPriceInclTax;

      totalQuantity += item.quantity;
      totalExclTax += subtotalExclTax;
      totalInclTax += subtotalInclTax;
    });

    // Supabaseで注文を作成（トランザクション）
    const now = new Date().toISOString();

    // 1. 注文を作成
    const { data: newOrder, error: orderError } = await supabaseServer
      .from('orders')
      .insert({
        item_count: totalQuantity,
        total_price_excluding_tax: totalExclTax,
        total_price_including_tax: totalInclTax,
        order_date: now,
      })
      .select()
      .single();

    if (orderError || !newOrder) {
      throw orderError || new Error('注文の作成に失敗しました');
    }

    // 2. 注文詳細を作成
    const orderDetails = items.map((item: {
      productId: number;
      quantity: number;
      unitPriceExclTax: number;
      unitPriceInclTax: number;
    }) => ({
      order_id: newOrder.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price_excluding_tax: item.unitPriceExclTax,
      unit_price_including_tax: item.unitPriceInclTax,
      subtotal_excluding_tax: item.quantity * item.unitPriceExclTax,
      subtotal_including_tax: item.quantity * item.unitPriceInclTax,
    }));

    const { error: detailsError } = await supabaseServer
      .from('order_details')
      .insert(orderDetails);

    if (detailsError) {
      // 注文詳細の挿入に失敗したら注文も削除（ロールバック）
      await supabaseServer.from('orders').delete().eq('id', newOrder.id);
      throw detailsError;
    }

    // 3. 在庫を減らす
    for (const item of items) {
      try {
        // 現在の在庫を取得
        const { data: stock } = await supabaseServer
          .from('stock')
          .select('quantity')
          .eq('product_id', item.productId)
          .single();

        if (stock) {
          // 在庫を減らす
          await supabaseServer
            .from('stock')
            .update({
              quantity: stock.quantity - item.quantity,
              updated_at: now,
            })
            .eq('product_id', item.productId);
        }
      } catch (e) {
        console.warn(`在庫更新スキップ: 商品ID ${item.productId}`, e);
      }
    }

    // 入出庫履歴に記録（注文による出庫）
    const stockMovements: StockMovementEntry[] = [];
    for (const item of items) {
      // 現在の在庫を取得（出庫後の値を計算するため）
      const { data: stockData } = await supabaseServer
        .from('stock')
        .select('quantity')
        .eq('product_id', item.productId)
        .single();

      const currentQty = stockData?.quantity ?? 0;
      stockMovements.push({
        productId: item.productId,
        userId: auth.user.id,
        userEmail: auth.user.email,
        movementType: 'order',
        quantity: -item.quantity,
        previousQuantity: currentQty + item.quantity, // 出庫前の在庫数
        newQuantity: currentQty,
        reason: `注文 #${newOrder.id}`,
        orderId: newOrder.id,
      });
    }
    await recordStockMovementBatch(stockMovements);

    // 監査ログに記録
    await recordAuditLog({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: 'create',
      targetTable: 'orders',
      targetId: String(newOrder.id),
      details: { itemCount: items.length, totalInclTax },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: newOrder.id,
        totalQuantity,
        totalExclTax,
        totalInclTax,
        itemCount: items.length,
        createdAt: newOrder.created_at,
      },
    });
  } catch (error) {
    const { errorResponse } = await import("@/lib/error-handler");
    return errorResponse(error, "注文の作成に失敗しました");
  }
}

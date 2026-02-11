import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/api-auth";
import type { Order, OrderDetail, Product, OrderWithDetails } from "@/types";

/**
 * 注文詳細を取得
 * GET /api/orders/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "無効な注文IDです" },
        { status: 400 }
      );
    }

    const auth = await requireAuth();
    if (!auth.authenticated) {
      return auth.response;
    }

    // Supabaseから注文と注文詳細を取得（JOINで一度に取得）
    const { data: orderData, error: orderError } = await supabaseServer
      .from('orders')
      .select(`
        *,
        order_details (
          *,
          products (*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json(
        { success: false, error: "注文が見つかりません" },
        { status: 404 }
      );
    }

    // 型変換（Supabase → 既存の型）
    const order: Order = {
      注文ID: orderData.id,
      商品数: orderData.item_count,
      "注文金額(税抜)": orderData.total_price_excluding_tax,
      "注文金額(税込)": orderData.total_price_including_tax,
      注文日: orderData.order_date,
    };

    // 注文詳細を型変換
    const orderDetails: (OrderDetail & { product?: Product })[] = (orderData.order_details || []).map((d: any) => {
      const product: Product | undefined = d.products ? {
        商品ID: d.products.id,
        商品名: d.products.name,
        画像URL: d.products.image_url || "",
        サイズ: d.products.size,
        商品コード: d.products.product_code,
        JANコード: d.products.jan_code,
        税抜価格: d.products.price_excluding_tax,
        税込価格: d.products.price_including_tax,
        作成日: d.products.created_at,
        更新日: d.products.updated_at,
      } : undefined;

      return {
        明細ID: d.id,
        注文ID: d.order_id,
        商品ID: d.product_id,
        数量: d.quantity,
        "単価(税抜)": d.unit_price_excluding_tax,
        "単価(税込)": d.unit_price_including_tax,
        "小計(税抜)": d.subtotal_excluding_tax,
        "小計(税込)": d.subtotal_including_tax,
        作成日: d.created_at,
        更新日: d.updated_at,
        product,
      };
    });

    const orderWithDetails: OrderWithDetails = {
      ...order,
      details: orderDetails,
    };

    return NextResponse.json({
      success: true,
      data: orderWithDetails,
    });
  } catch (error) {
    console.error("Order Detail API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

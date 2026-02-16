/**
 * テスト用サンプルデータをSupabaseに追加するAPI
 * POST /api/seed-data
 * 
 * 直近30日間のサンプル注文データを生成し、
 * ダッシュボードやレポートの売上推移グラフを確認するために使用できます。
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST() {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    // 商品データを取得
    const { data: products, error: prodError } = await supabaseServer
      .from('products')
      .select('id, price_excluding_tax, price_including_tax')
      .limit(10);

    if (prodError || !products || products.length === 0) {
      return NextResponse.json({
        success: false,
        error: '商品データがありません。先にCSVインポートで商品を登録してください。',
      }, { status: 400 });
    }

    // 直近30日分のサンプルデータを作成
    const now = new Date();
    let ordersAdded = 0;
    let detailsAdded = 0;

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      // 1日あたり1〜3件の注文をランダムに作成
      const orderCount = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < orderCount; j++) {
        // ランダムに商品を選択（1〜4商品）
        const itemCount = Math.min(Math.floor(Math.random() * 4) + 1, products.length);
        const selectedProducts = [...products]
          .sort(() => Math.random() - 0.5)
          .slice(0, itemCount);

        let orderTotalExclTax = 0;
        let orderTotalInclTax = 0;
        let totalQuantity = 0;

        // 注文明細データを準備
        const details: Array<{
          product_id: number;
          quantity: number;
          unit_price_excluding_tax: number;
          unit_price_including_tax: number;
          subtotal_excluding_tax: number;
          subtotal_including_tax: number;
        }> = [];

        for (const product of selectedProducts) {
          const quantity = Math.floor(Math.random() * 3) + 1;
          const priceExclTax = product.price_excluding_tax || 1000;
          const priceInclTax = product.price_including_tax || 1100;
          const subtotalExclTax = priceExclTax * quantity;
          const subtotalInclTax = priceInclTax * quantity;

          details.push({
            product_id: product.id,
            quantity,
            unit_price_excluding_tax: priceExclTax,
            unit_price_including_tax: priceInclTax,
            subtotal_excluding_tax: subtotalExclTax,
            subtotal_including_tax: subtotalInclTax,
          });

          orderTotalExclTax += subtotalExclTax;
          orderTotalInclTax += subtotalInclTax;
          totalQuantity += quantity;
        }

        // 注文をSupabaseに挿入
        const { data: newOrder, error: orderError } = await supabaseServer
          .from('orders')
          .insert({
            item_count: totalQuantity,
            total_price_excluding_tax: orderTotalExclTax,
            total_price_including_tax: orderTotalInclTax,
            order_date: dateStr,
          })
          .select('id')
          .single();

        if (orderError || !newOrder) {
          console.error('注文追加エラー:', orderError);
          continue;
        }

        // 注文明細をSupabaseに挿入
        const detailsWithOrderId = details.map(d => ({
          ...d,
          order_id: newOrder.id,
        }));

        const { error: detailError } = await supabaseServer
          .from('order_details')
          .insert(detailsWithOrderId);

        if (detailError) {
          console.error('明細追加エラー:', detailError);
        } else {
          detailsAdded += details.length;
        }

        ordersAdded++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${ordersAdded}件の注文と${detailsAdded}件の明細を追加しました`,
      data: {
        ordersAdded,
        detailsAdded,
      },
    });
  } catch (error) {
    console.error('Seed Data API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

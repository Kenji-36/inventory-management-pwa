/**
 * デバッグ用: 在庫データをリセット
 * GET /api/debug/reset-stock
 * 
 * 開発環境専用
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  // 開発環境のみ実行可能
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: "この機能は開発環境でのみ使用できます" },
      { status: 403 }
    );
  }

  try {
    console.log('🔧 在庫データをリセット中...');

    // 1. 現在の在庫状況を取得
    const { data: beforeData } = await supabaseServer
      .from('stock')
      .select('id, product_id, quantity');

    console.log('📊 リセット前:', {
      total: beforeData?.length || 0,
      totalStock: beforeData?.reduce((sum, s) => sum + s.quantity, 0) || 0,
    });

    // 2. 全ての商品を取得
    const { data: products, error: productsError } = await supabaseServer
      .from('products')
      .select('id');

    if (productsError) {
      console.error('❌ 商品取得エラー:', productsError);
      throw productsError;
    }

    console.log('📦 商品数:', products?.length || 0);

    // 3. 在庫レコードが存在しない商品に対して在庫を作成
    const existingProductIds = new Set(beforeData?.map(s => s.product_id) || []);
    const missingProducts = products?.filter(p => !existingProductIds.has(p.id)) || [];

    console.log('🆕 在庫レコードが存在しない商品数:', missingProducts.length);

    if (missingProducts.length > 0) {
      const newStockRecords = missingProducts.map(p => ({
        product_id: p.id,
        quantity: 10,
        updated_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabaseServer
        .from('stock')
        .insert(newStockRecords);

      if (insertError) {
        console.error('❌ 在庫作成エラー:', insertError);
        throw insertError;
      }

      console.log('✅ 在庫レコードを作成:', newStockRecords.length);
    }

    // 4. 全ての在庫を10に設定
    const { error: updateError } = await supabaseServer
      .from('stock')
      .update({ 
        quantity: 10,
        updated_at: new Date().toISOString(),
      })
      .neq('id', 0); // 全レコードを対象

    if (updateError) {
      console.error('❌ 更新エラー:', updateError);
      throw updateError;
    }

    console.log('✅ 在庫を更新しました');

    // 5. 更新後の在庫状況を取得
    const { data: afterData } = await supabaseServer
      .from('stock')
      .select('id, product_id, quantity');

    console.log('📊 リセット後:', {
      total: afterData?.length || 0,
      totalStock: afterData?.reduce((sum, s) => sum + s.quantity, 0) || 0,
    });

    // 6. 詳細を返す
    return NextResponse.json({
      success: true,
      message: "在庫データをリセットしました",
      data: {
        products: {
          total: products?.length || 0,
        },
        before: {
          count: beforeData?.length || 0,
          totalStock: beforeData?.reduce((sum, s) => sum + s.quantity, 0) || 0,
        },
        created: {
          count: missingProducts.length,
        },
        after: {
          count: afterData?.length || 0,
          totalStock: afterData?.reduce((sum, s) => sum + s.quantity, 0) || 0,
        },
        samples: afterData?.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('❌ エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "エラーが発生しました" 
      },
      { status: 500 }
    );
  }
}

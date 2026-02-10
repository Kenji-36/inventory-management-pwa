/**
 * デバッグ用: 在庫データの詳細確認
 * GET /api/debug/check-stock
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    console.log('🔍 在庫データを調査中...');

    // 1. stockテーブルの全データを取得
    const { data: stockData, error: stockError } = await supabaseServer
      .from('stock')
      .select('*')
      .order('product_id');

    if (stockError) {
      console.error('❌ stock取得エラー:', stockError);
      throw stockError;
    }

    // 2. productsテーブルの全データを取得
    const { data: productsData, error: productsError } = await supabaseServer
      .from('products')
      .select('*')
      .order('id');

    if (productsError) {
      console.error('❌ products取得エラー:', productsError);
      throw productsError;
    }

    // 3. productsとstockを結合して取得（API routeと同じ方法）
    const { data: productsWithStockData, error: joinError } = await supabaseServer
      .from('products')
      .select('*, stock(*)')
      .order('id')
      .limit(5);

    if (joinError) {
      console.error('❌ 結合取得エラー:', joinError);
    }

    console.log('🔍 結合クエリ結果（最初の商品）:', productsWithStockData?.[0]);

    // 3. 統計情報
    const stats = {
      stock: {
        total: stockData?.length || 0,
        totalQuantity: stockData?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0,
        withStock: stockData?.filter(s => s.quantity > 0).length || 0,
        zeroStock: stockData?.filter(s => s.quantity === 0).length || 0,
      },
      products: {
        total: productsData?.length || 0,
      },
    };

    console.log('📊 統計:', stats);

    // 4. 在庫データのサンプル（最初の10件）
    const stockSamples = stockData?.slice(0, 10).map(s => ({
      id: s.id,
      product_id: s.product_id,
      quantity: s.quantity,
      updated_at: s.updated_at,
    }));

    // 5. 商品データのサンプル（最初の5件）
    const productSamples = productsData?.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      size: p.size,
      jan_code: p.jan_code,
    }));

    return NextResponse.json({
      success: true,
      stats,
      samples: {
        stock: stockSamples,
        products: productSamples,
        productsWithStock: productsWithStockData,
      },
      raw: {
        stockCount: stockData?.length,
        productsCount: productsData?.length,
        joinedCount: productsWithStockData?.length,
      },
    });
  } catch (error) {
    console.error('❌ エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "エラーが発生しました",
        details: error,
      },
      { status: 500 }
    );
  }
}

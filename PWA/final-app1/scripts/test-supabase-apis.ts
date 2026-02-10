/**
 * Supabase API 動作確認テストスクリプト
 * 
 * 実行方法:
 * npx tsx scripts/test-supabase-apis.ts
 */

import * as dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

import { supabaseServer } from '../src/lib/supabase-server';

interface TestResult {
  name: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

/**
 * テスト1: 商品データの取得
 */
async function testProducts() {
  console.log('\n📦 テスト1: 商品データの取得');
  try {
    const { data, error } = await supabaseServer
      .from('products')
      .select('*, stock(*)')
      .limit(5);

    if (error) throw error;

    console.log(`  ✅ 成功: ${data?.length || 0}件の商品を取得`);
    console.log(`  サンプル:`, data?.[0]);
    
    results.push({
      name: '商品データ取得',
      status: 'success',
      message: `${data?.length || 0}件取得`,
      data: data?.[0],
    });
  } catch (error) {
    console.error('  ❌ エラー:', error);
    results.push({
      name: '商品データ取得',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * テスト2: 在庫データの取得
 */
async function testStock() {
  console.log('\n📊 テスト2: 在庫データの取得');
  try {
    const { data, error } = await supabaseServer
      .from('stock')
      .select('*')
      .limit(5);

    if (error) throw error;

    console.log(`  ✅ 成功: ${data?.length || 0}件の在庫を取得`);
    console.log(`  サンプル:`, data?.[0]);
    
    results.push({
      name: '在庫データ取得',
      status: 'success',
      message: `${data?.length || 0}件取得`,
      data: data?.[0],
    });
  } catch (error) {
    console.error('  ❌ エラー:', error);
    results.push({
      name: '在庫データ取得',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * テスト3: 注文データの取得
 */
async function testOrders() {
  console.log('\n🛒 テスト3: 注文データの取得');
  try {
    const { data, error } = await supabaseServer
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false })
      .limit(5);

    if (error) throw error;

    console.log(`  ✅ 成功: ${data?.length || 0}件の注文を取得`);
    console.log(`  サンプル:`, data?.[0]);
    
    results.push({
      name: '注文データ取得',
      status: 'success',
      message: `${data?.length || 0}件取得`,
      data: data?.[0],
    });
  } catch (error) {
    console.error('  ❌ エラー:', error);
    results.push({
      name: '注文データ取得',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * テスト4: 注文詳細データの取得（JOIN）
 */
async function testOrderDetails() {
  console.log('\n📋 テスト4: 注文詳細データの取得（JOIN）');
  try {
    const { data, error } = await supabaseServer
      .from('orders')
      .select(`
        *,
        order_details (
          *,
          products (*)
        )
      `)
      .limit(1)
      .single();

    if (error) throw error;

    console.log(`  ✅ 成功: 注文詳細を取得`);
    console.log(`  注文ID: ${data?.id}`);
    console.log(`  注文詳細数: ${data?.order_details?.length || 0}件`);
    
    results.push({
      name: '注文詳細取得（JOIN）',
      status: 'success',
      message: `注文ID ${data?.id}、詳細${data?.order_details?.length || 0}件`,
    });
  } catch (error) {
    console.error('  ❌ エラー:', error);
    results.push({
      name: '注文詳細取得（JOIN）',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * テスト5: JANコードで商品検索
 */
async function testProductByJanCode() {
  console.log('\n🔍 テスト5: JANコードで商品検索');
  try {
    // まず最初の商品のJANコードを取得
    const { data: firstProduct } = await supabaseServer
      .from('products')
      .select('jan_code')
      .limit(1)
      .single();

    if (!firstProduct) {
      throw new Error('テスト用の商品が見つかりません');
    }

    const { data, error } = await supabaseServer
      .from('products')
      .select('*, stock(*)')
      .eq('jan_code', firstProduct.jan_code)
      .single();

    if (error) throw error;

    console.log(`  ✅ 成功: JANコード ${firstProduct.jan_code} で商品を検索`);
    console.log(`  商品名: ${data?.name}`);
    
    results.push({
      name: 'JANコード検索',
      status: 'success',
      message: `JANコード ${firstProduct.jan_code} で検索成功`,
    });
  } catch (error) {
    console.error('  ❌ エラー:', error);
    results.push({
      name: 'JANコード検索',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * テスト6: データ集計（ダッシュボード用）
 */
async function testAggregation() {
  console.log('\n📈 テスト6: データ集計');
  try {
    const [
      { count: productsCount },
      { count: stockCount },
      { count: ordersCount },
      { count: orderDetailsCount },
    ] = await Promise.all([
      supabaseServer.from('products').select('*', { count: 'exact', head: true }),
      supabaseServer.from('stock').select('*', { count: 'exact', head: true }),
      supabaseServer.from('orders').select('*', { count: 'exact', head: true }),
      supabaseServer.from('order_details').select('*', { count: 'exact', head: true }),
    ]);

    console.log(`  ✅ 成功: データ集計完了`);
    console.log(`  商品: ${productsCount}件`);
    console.log(`  在庫: ${stockCount}件`);
    console.log(`  注文: ${ordersCount}件`);
    console.log(`  注文詳細: ${orderDetailsCount}件`);
    
    results.push({
      name: 'データ集計',
      status: 'success',
      message: `商品${productsCount}、在庫${stockCount}、注文${ordersCount}、詳細${orderDetailsCount}`,
    });
  } catch (error) {
    console.error('  ❌ エラー:', error);
    results.push({
      name: 'データ集計',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 Supabase API 動作確認テスト開始');
  console.log('================================================');

  await testProducts();
  await testStock();
  await testOrders();
  await testOrderDetails();
  await testProductByJanCode();
  await testAggregation();

  console.log('\n================================================');
  console.log('📊 テスト結果サマリー');
  console.log('================================================');

  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  results.forEach((result) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
  });

  console.log('\n================================================');
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`❌ エラー: ${errorCount}件`);
  console.log('================================================');

  if (errorCount > 0) {
    process.exit(1);
  }
}

main();

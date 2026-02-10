/**
 * Supabase データ移行検証スクリプト
 * 
 * 移行後のデータ整合性を詳細にチェックします。
 * 
 * 実行方法:
 * npx tsx scripts/verify-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

// Supabase クライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * テーブルのレコード数をチェック
 */
async function checkRecordCounts() {
  console.log('\n📊 レコード数チェック');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tables = ['products', 'stock', 'orders', 'order_details', 'users'];
  const results: Record<string, number> = {};

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`  ❌ ${table}: エラー - ${error.message}`);
    } else {
      results[table] = count || 0;
      console.log(`  ✅ ${table}: ${count}件`);
    }
  }

  return results;
}

/**
 * 外部キー制約をチェック
 */
async function checkForeignKeys() {
  console.log('\n🔗 外部キー制約チェック');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let hasErrors = false;

  // 1. stock.product_id → products.id
  console.log('\n  1. stock.product_id → products.id');
  const { data: stockWithoutProduct, error: stockError } = await supabase
    .from('stock')
    .select('id, product_id')
    .not('product_id', 'in', `(SELECT id FROM products)`);

  if (stockError) {
    console.error(`    ❌ エラー: ${stockError.message}`);
    hasErrors = true;
  } else if (stockWithoutProduct && stockWithoutProduct.length > 0) {
    console.error(`    ❌ ${stockWithoutProduct.length}件の在庫が存在しない商品を参照`);
    stockWithoutProduct.slice(0, 5).forEach((s: any) => {
      console.error(`       在庫ID: ${s.id}, 商品ID: ${s.product_id}`);
    });
    hasErrors = true;
  } else {
    console.log('    ✅ OK');
  }

  // 2. order_details.order_id → orders.id
  console.log('\n  2. order_details.order_id → orders.id');
  const { data: detailsWithoutOrder, error: detailsOrderError } = await supabase
    .from('order_details')
    .select('id, order_id')
    .not('order_id', 'in', `(SELECT id FROM orders)`);

  if (detailsOrderError) {
    console.error(`    ❌ エラー: ${detailsOrderError.message}`);
    hasErrors = true;
  } else if (detailsWithoutOrder && detailsWithoutOrder.length > 0) {
    console.error(`    ❌ ${detailsWithoutOrder.length}件の注文詳細が存在しない注文を参照`);
    hasErrors = true;
  } else {
    console.log('    ✅ OK');
  }

  // 3. order_details.product_id → products.id
  console.log('\n  3. order_details.product_id → products.id');
  const { data: detailsWithoutProduct, error: detailsProductError } = await supabase
    .from('order_details')
    .select('id, product_id')
    .not('product_id', 'in', `(SELECT id FROM products)`);

  if (detailsProductError) {
    console.error(`    ❌ エラー: ${detailsProductError.message}`);
    hasErrors = true;
  } else if (detailsWithoutProduct && detailsWithoutProduct.length > 0) {
    console.error(`    ❌ ${detailsWithoutProduct.length}件の注文詳細が存在しない商品を参照`);
    hasErrors = true;
  } else {
    console.log('    ✅ OK');
  }

  return !hasErrors;
}

/**
 * データの整合性をチェック
 */
async function checkDataIntegrity() {
  console.log('\n🔍 データ整合性チェック');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let hasErrors = false;

  // 1. 商品の価格チェック（税抜 < 税込）
  console.log('\n  1. 商品価格の整合性');
  const { data: invalidPriceProducts, error: priceError } = await supabase
    .from('products')
    .select('id, name, price_excluding_tax, price_including_tax')
    .gt('price_excluding_tax', 'price_including_tax');

  if (priceError) {
    console.error(`    ❌ エラー: ${priceError.message}`);
    hasErrors = true;
  } else if (invalidPriceProducts && invalidPriceProducts.length > 0) {
    console.error(`    ❌ ${invalidPriceProducts.length}件の商品で税抜価格 > 税込価格`);
    hasErrors = true;
  } else {
    console.log('    ✅ OK');
  }

  // 2. 在庫数がマイナスでないかチェック
  console.log('\n  2. 在庫数の整合性');
  const { data: negativeStock, error: stockError } = await supabase
    .from('stock')
    .select('id, product_id, quantity')
    .lt('quantity', 0);

  if (stockError) {
    console.error(`    ❌ エラー: ${stockError.message}`);
    hasErrors = true;
  } else if (negativeStock && negativeStock.length > 0) {
    console.error(`    ❌ ${negativeStock.length}件の在庫数がマイナス`);
    hasErrors = true;
  } else {
    console.log('    ✅ OK');
  }

  // 3. 注文金額の整合性チェック
  console.log('\n  3. 注文金額の整合性');
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      total_price_excluding_tax,
      total_price_including_tax,
      order_details (
        subtotal_excluding_tax,
        subtotal_including_tax
      )
    `);

  if (ordersError) {
    console.error(`    ❌ エラー: ${ordersError.message}`);
    hasErrors = true;
  } else if (orders) {
    let invalidOrders = 0;
    orders.forEach((order: any) => {
      const detailsExcludingTax = order.order_details.reduce(
        (sum: number, d: any) => sum + d.subtotal_excluding_tax,
        0
      );
      const detailsIncludingTax = order.order_details.reduce(
        (sum: number, d: any) => sum + d.subtotal_including_tax,
        0
      );

      if (
        order.total_price_excluding_tax !== detailsExcludingTax ||
        order.total_price_including_tax !== detailsIncludingTax
      ) {
        invalidOrders++;
      }
    });

    if (invalidOrders > 0) {
      console.error(`    ❌ ${invalidOrders}件の注文で金額が不一致`);
      hasErrors = true;
    } else {
      console.log('    ✅ OK');
    }
  }

  // 4. JANコードの重複チェック
  console.log('\n  4. JANコードの重複チェック');
  const { data: duplicateJan, error: janError } = await supabase.rpc('check_duplicate_jan');

  // RPCが存在しない場合は手動でチェック
  const { data: allProducts, error: allProductsError } = await supabase
    .from('products')
    .select('jan_code');

  if (allProductsError) {
    console.error(`    ❌ エラー: ${allProductsError.message}`);
    hasErrors = true;
  } else if (allProducts) {
    const janCodes = allProducts.map((p: any) => p.jan_code);
    const duplicates = janCodes.filter((jan, index) => janCodes.indexOf(jan) !== index);

    if (duplicates.length > 0) {
      console.error(`    ❌ ${duplicates.length}件のJANコードが重複`);
      hasErrors = true;
    } else {
      console.log('    ✅ OK');
    }
  }

  return !hasErrors;
}

/**
 * サンプルデータを取得して表示
 */
async function showSampleData() {
  console.log('\n📄 サンプルデータ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 商品サンプル
  console.log('\n  商品（最初の3件）:');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, product_code, jan_code, price_including_tax')
    .limit(3);

  if (productsError) {
    console.error(`    ❌ エラー: ${productsError.message}`);
  } else if (products) {
    products.forEach((p: any) => {
      console.log(`    ID: ${p.id}, 名前: ${p.name}, コード: ${p.product_code}, 価格: ¥${p.price_including_tax}`);
    });
  }

  // 在庫サンプル
  console.log('\n  在庫（最初の3件）:');
  const { data: stocks, error: stocksError } = await supabase
    .from('stock')
    .select(`
      id,
      quantity,
      products (name)
    `)
    .limit(3);

  if (stocksError) {
    console.error(`    ❌ エラー: ${stocksError.message}`);
  } else if (stocks) {
    stocks.forEach((s: any) => {
      console.log(`    在庫ID: ${s.id}, 商品: ${s.products.name}, 在庫数: ${s.quantity}`);
    });
  }

  // 注文サンプル
  console.log('\n  注文（最初の3件）:');
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, item_count, total_price_including_tax, order_date')
    .limit(3);

  if (ordersError) {
    console.error(`    ❌ エラー: ${ordersError.message}`);
  } else if (orders) {
    orders.forEach((o: any) => {
      const date = new Date(o.order_date).toLocaleDateString('ja-JP');
      console.log(`    注文ID: ${o.id}, 商品数: ${o.item_count}, 合計: ¥${o.total_price_including_tax}, 日付: ${date}`);
    });
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🔍 Supabase データ移行検証を開始します');
  console.log('================================================');

  try {
    // 1. レコード数チェック
    const counts = await checkRecordCounts();

    // 2. 外部キー制約チェック
    const foreignKeysOk = await checkForeignKeys();

    // 3. データ整合性チェック
    const dataIntegrityOk = await checkDataIntegrity();

    // 4. サンプルデータ表示
    await showSampleData();

    // 結果サマリー
    console.log('\n================================================');
    console.log('📊 検証結果サマリー');
    console.log('================================================');
    console.log(`  商品: ${counts.products}件`);
    console.log(`  在庫: ${counts.stock}件`);
    console.log(`  注文: ${counts.orders}件`);
    console.log(`  注文詳細: ${counts.order_details}件`);
    console.log(`  ユーザー: ${counts.users}件`);
    console.log('');
    console.log(`  外部キー制約: ${foreignKeysOk ? '✅ OK' : '❌ NG'}`);
    console.log(`  データ整合性: ${dataIntegrityOk ? '✅ OK' : '❌ NG'}`);

    if (foreignKeysOk && dataIntegrityOk) {
      console.log('\n✅ すべての検証に合格しました！');
    } else {
      console.log('\n⚠️  一部の検証で問題が見つかりました。上記のエラーを確認してください。');
    }

    console.log('================================================');
  } catch (error) {
    console.error('\n================================================');
    console.error('❌ 検証中にエラーが発生しました');
    console.error('================================================');
    console.error(error);
    process.exit(1);
  }
}

// スクリプト実行
main();

/**
 * Google Sheets から Supabase へのデータ移行スクリプト
 * 
 * 実行方法:
 * 1. Supabaseプロジェクトを作成し、環境変数を設定
 * 2. データベーススキーマを作成（setup-supabase.mdを参照）
 * 3. npm install @supabase/supabase-js
 * 4. npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
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

// Google Sheets クライアントの初期化
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

// シート名の定義
const SHEET_NAMES = {
  PRODUCTS: '商品',
  STOCK: '在庫情報',
  ORDERS: '注文情報',
  ORDER_DETAILS: '注文詳細',
} as const;

/**
 * Google Sheets からデータを取得
 */
async function getSheetData(sheetName: string) {
  const sheets = await getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return [];
  }

  // ヘッダー行を取得
  const headers = rows[0];

  // データ行をオブジェクトに変換
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

/**
 * 商品データの移行
 */
async function migrateProducts() {
  console.log('\n📦 商品データの移行を開始...');

  try {
    const productsRaw = await getSheetData(SHEET_NAMES.PRODUCTS);
    console.log(`  取得: ${productsRaw.length}件の商品データ`);

    if (productsRaw.length === 0) {
      console.log('  ⚠️  商品データがありません');
      return;
    }

    // データ変換
    const products = productsRaw
      .filter((p) => p['商品ID']) // 空行を除外
      .map((p) => ({
        id: parseInt(p['商品ID']),
        name: p['商品名'],
        image_url: p['画像URL'] || null,
        size: p['サイズ'],
        product_code: p['商品コード'],
        jan_code: p['JANコード'],
        price_excluding_tax: parseInt(p['税抜価格']) || 0,
        price_including_tax: parseInt(p['税込価格']) || 0,
        // created_at と updated_at は自動設定される
      }));

    console.log(`  変換: ${products.length}件の商品データ`);

    // Supabaseに挿入
    const { data, error } = await supabase
      .from('products')
      .insert(products)
      .select();

    if (error) {
      console.error('  ❌ エラー:', error.message);
      throw error;
    }

    console.log(`  ✅ 成功: ${data?.length || 0}件の商品を移行しました`);
    return data;
  } catch (error) {
    console.error('  ❌ 商品データの移行に失敗:', error);
    throw error;
  }
}

/**
 * 在庫データの移行
 */
async function migrateStock() {
  console.log('\n📊 在庫データの移行を開始...');

  try {
    const stockRaw = await getSheetData(SHEET_NAMES.STOCK);
    console.log(`  取得: ${stockRaw.length}件の在庫データ`);

    if (stockRaw.length === 0) {
      console.log('  ⚠️  在庫データがありません');
      return;
    }

    // データ変換
    const stocks = stockRaw
      .filter((s) => s['在庫ID']) // 空行を除外
      .map((s) => ({
        id: parseInt(s['在庫ID']),
        product_id: parseInt(s['商品ID']),
        quantity: parseInt(s['在庫数']) || 0,
        last_stocked_date: s['最終入庫日'] ? new Date(s['最終入庫日']).toISOString().split('T')[0] : null,
      }));

    console.log(`  変換: ${stocks.length}件の在庫データ`);

    // Supabaseに挿入
    const { data, error } = await supabase
      .from('stock')
      .insert(stocks)
      .select();

    if (error) {
      console.error('  ❌ エラー:', error.message);
      throw error;
    }

    console.log(`  ✅ 成功: ${data?.length || 0}件の在庫を移行しました`);
    return data;
  } catch (error) {
    console.error('  ❌ 在庫データの移行に失敗:', error);
    throw error;
  }
}

/**
 * 注文データの移行
 */
async function migrateOrders() {
  console.log('\n🛒 注文データの移行を開始...');

  try {
    const ordersRaw = await getSheetData(SHEET_NAMES.ORDERS);
    console.log(`  取得: ${ordersRaw.length}件の注文データ`);

    if (ordersRaw.length === 0) {
      console.log('  ⚠️  注文データがありません');
      return;
    }

    // データ変換
    const orders = ordersRaw
      .filter((o) => o['注文ID']) // 空行を除外
      .map((o) => ({
        id: parseInt(o['注文ID']),
        item_count: parseInt(o['商品数']) || 0,
        total_price_excluding_tax: parseInt(o['注文金額(税抜)'].replace(/[^0-9]/g, '')) || 0,
        total_price_including_tax: parseInt(o['注文金額(税込)'].replace(/[^0-9]/g, '')) || 0,
        order_date: o['注文日'] ? new Date(o['注文日']).toISOString() : new Date().toISOString(),
      }));

    console.log(`  変換: ${orders.length}件の注文データ`);

    // Supabaseに挿入
    const { data, error } = await supabase
      .from('orders')
      .insert(orders)
      .select();

    if (error) {
      console.error('  ❌ エラー:', error.message);
      throw error;
    }

    console.log(`  ✅ 成功: ${data?.length || 0}件の注文を移行しました`);
    return data;
  } catch (error) {
    console.error('  ❌ 注文データの移行に失敗:', error);
    throw error;
  }
}

/**
 * 注文詳細データの移行
 */
async function migrateOrderDetails() {
  console.log('\n📋 注文詳細データの移行を開始...');

  try {
    const orderDetailsRaw = await getSheetData(SHEET_NAMES.ORDER_DETAILS);
    console.log(`  取得: ${orderDetailsRaw.length}件の注文詳細データ`);

    if (orderDetailsRaw.length === 0) {
      console.log('  ⚠️  注文詳細データがありません');
      return;
    }

    // データ変換
    // 注意: Google Sheetsの明細IDは注文ごとにリセットされるため
    // Supabaseではユニークな連番を自動採番させる（idを指定しない）
    const orderDetails = orderDetailsRaw
      .filter((od) => od['明細ID']) // 空行を除外
      .map((od) => ({
        // id は指定しない（BIGSERIALで自動採番）
        order_id: parseInt(od['注文ID']),
        product_id: parseInt(od['商品ID']),
        quantity: parseInt(od['数量']) || 0,
        unit_price_excluding_tax: parseInt(String(od['単価(税抜)']).replace(/[^0-9]/g, '')) || 0,
        unit_price_including_tax: parseInt(String(od['単価(税込)']).replace(/[^0-9]/g, '')) || 0,
        subtotal_excluding_tax: parseInt(String(od['小計(税抜)']).replace(/[^0-9]/g, '')) || 0,
        subtotal_including_tax: parseInt(String(od['小計(税込)']).replace(/[^0-9]/g, '')) || 0,
      }));

    console.log(`  変換: ${orderDetails.length}件の注文詳細データ`);

    // Supabaseに挿入
    const { data, error } = await supabase
      .from('order_details')
      .insert(orderDetails)
      .select();

    if (error) {
      console.error('  ❌ エラー:', error.message);
      throw error;
    }

    console.log(`  ✅ 成功: ${data?.length || 0}件の注文詳細を移行しました`);
    return data;
  } catch (error) {
    console.error('  ❌ 注文詳細データの移行に失敗:', error);
    throw error;
  }
}

/**
 * データ整合性チェック
 */
async function verifyMigration() {
  console.log('\n🔍 データ整合性チェック...');

  try {
    // 商品数チェック
    const { count: productsCount, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) throw productsError;
    console.log(`  商品: ${productsCount}件`);

    // 在庫数チェック
    const { count: stockCount, error: stockError } = await supabase
      .from('stock')
      .select('*', { count: 'exact', head: true });

    if (stockError) throw stockError;
    console.log(`  在庫: ${stockCount}件`);

    // 注文数チェック
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordersError) throw ordersError;
    console.log(`  注文: ${ordersCount}件`);

    // 注文詳細数チェック
    const { count: orderDetailsCount, error: orderDetailsError } = await supabase
      .from('order_details')
      .select('*', { count: 'exact', head: true });

    if (orderDetailsError) throw orderDetailsError;
    console.log(`  注文詳細: ${orderDetailsCount}件`);

    // 外部キー制約チェック（JOINで確認）
    console.log('\n  外部キー制約チェック...');

    // 在庫テーブルの商品IDが存在するか確認
    const { data: stockData } = await supabase
      .from('stock')
      .select('id, product_id, products(id)')
      .limit(1000);

    const orphanedStock = stockData?.filter((s: any) => !s.products) || [];
    if (orphanedStock.length > 0) {
      console.log(`  ⚠️  警告: ${orphanedStock.length}件の在庫が存在しない商品を参照しています`);
    } else {
      console.log(`  ✅ 在庫の外部キー制約: OK`);
    }

    // 注文詳細テーブルの注文IDが存在するか確認
    const { data: detailData } = await supabase
      .from('order_details')
      .select('id, order_id, orders(id)')
      .limit(1000);

    const orphanedDetails = detailData?.filter((d: any) => !d.orders) || [];
    if (orphanedDetails.length > 0) {
      console.log(`  ⚠️  警告: ${orphanedDetails.length}件の注文詳細が存在しない注文を参照しています`);
    } else {
      console.log(`  ✅ 注文詳細の外部キー制約: OK`);
    }

    console.log('\n✅ データ整合性チェック完了');
  } catch (error) {
    console.error('❌ データ整合性チェックに失敗:', error);
    throw error;
  }
}

/**
 * 既存データのクリーンアップ（再移行用）
 */
async function cleanupExistingData() {
  console.log('\n🧹 既存データのクリーンアップ...');

  // 外部キー制約を考慮して、子テーブルから削除
  const tables = ['order_details', 'orders', 'stock', 'products'];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .gte('id', 0); // 全レコードを削除

    if (error) {
      console.error(`  ❌ ${table} のクリーンアップに失敗:`, error.message);
      throw error;
    }
    console.log(`  ✅ ${table} をクリーンアップしました`);
  }

  console.log('  ✅ クリーンアップ完了');
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 Google Sheets → Supabase データ移行を開始します');
  console.log('================================================');

  const startTime = Date.now();

  try {
    // 0. 既存データのクリーンアップ（再移行時のため）
    await cleanupExistingData();

    // 1. 商品データの移行
    await migrateProducts();

    // 2. 在庫データの移行
    await migrateStock();

    // 3. 注文データの移行
    await migrateOrders();

    // 4. 注文詳細データの移行
    await migrateOrderDetails();

    // 5. データ整合性チェック
    await verifyMigration();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n================================================');
    console.log(`✅ データ移行が完了しました！（所要時間: ${duration}秒）`);
    console.log('================================================');
  } catch (error) {
    console.error('\n================================================');
    console.error('❌ データ移行に失敗しました');
    console.error('================================================');
    console.error(error);
    process.exit(1);
  }
}

// スクリプト実行
main();

/**
 * Google Sheets データバックアップスクリプト
 * 
 * 移行前に既存データをJSONファイルとしてバックアップします。
 * 
 * 実行方法:
 * npx tsx scripts/backup-google-sheets.ts
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

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
  USERS: 'ユーザマスタ',
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
 * メイン処理
 */
async function main() {
  console.log('📦 Google Sheets データバックアップを開始します');
  console.log('================================================');

  const backupDir = path.join(process.cwd(), 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  try {
    // バックアップディレクトリを作成
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    console.log(`\n📁 バックアップ先: ${backupPath}\n`);

    const backupData: Record<string, any[]> = {};

    // 各シートのデータを取得してバックアップ
    for (const [key, sheetName] of Object.entries(SHEET_NAMES)) {
      console.log(`📄 ${sheetName} をバックアップ中...`);

      try {
        const data = await getSheetData(sheetName);
        backupData[sheetName] = data;

        // 個別のJSONファイルとして保存
        const filename = `${key.toLowerCase()}.json`;
        const filepath = path.join(backupPath, filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');

        console.log(`  ✅ ${data.length}件のデータを保存: ${filename}`);
      } catch (error) {
        console.error(`  ❌ エラー: ${sheetName} のバックアップに失敗`);
        console.error(error);
      }
    }

    // 統合バックアップファイルを作成
    const allDataPath = path.join(backupPath, 'all-data.json');
    fs.writeFileSync(
      allDataPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          spreadsheetId,
          data: backupData,
        },
        null,
        2
      ),
      'utf-8'
    );

    console.log(`\n✅ 統合バックアップファイルを作成: all-data.json`);

    // バックアップサマリーを作成
    const summary = {
      timestamp: new Date().toISOString(),
      spreadsheetId,
      sheets: Object.entries(backupData).map(([name, data]) => ({
        name,
        count: data.length,
      })),
      totalRecords: Object.values(backupData).reduce((sum, data) => sum + data.length, 0),
    };

    const summaryPath = path.join(backupPath, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    console.log('\n📊 バックアップサマリー:');
    summary.sheets.forEach((sheet) => {
      console.log(`  ${sheet.name}: ${sheet.count}件`);
    });
    console.log(`  合計: ${summary.totalRecords}件`);

    console.log('\n================================================');
    console.log('✅ バックアップが完了しました！');
    console.log(`📁 保存先: ${backupPath}`);
    console.log('================================================');
  } catch (error) {
    console.error('\n================================================');
    console.error('❌ バックアップに失敗しました');
    console.error('================================================');
    console.error(error);
    process.exit(1);
  }
}

// スクリプト実行
main();

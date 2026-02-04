/**
 * Google Sheets API連携用ユーティリティ
 * 
 * このファイルはGoogle Sheetsとの連携機能を提供します。
 * 実装にはGoogle Cloud PlatformでのAPIセットアップが必要です。
 */

import { google } from "googleapis";

// シート名の定義
export const SHEET_NAMES = {
  PRODUCTS: "商品",
  STOCK: "在庫情報",
  ORDERS: "注文情報",
  ORDER_DETAILS: "注文詳細",
  USERS: "ユーザマスタ",
} as const;

// Google Sheets API クライアントの初期化
export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

// スプレッドシートIDの取得
export function getSpreadsheetId() {
  return process.env.GOOGLE_SPREADSHEET_ID || "";
}

/**
 * シートからデータを取得
 */
export async function getSheetData(sheetName: string) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

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
    const obj: Record<string, string | number> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || "";
    });
    return obj;
  });
}

/**
 * シートにデータを追加
 */
export async function appendSheetData(
  sheetName: string,
  values: (string | number)[][]
) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });

  return response.data;
}

/**
 * シートのデータを更新
 */
export async function updateSheetData(
  sheetName: string,
  range: string,
  values: (string | number)[][]
) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!${range}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });

  return response.data;
}

/**
 * 特定の行を検索して更新
 */
export async function findAndUpdateRow(
  sheetName: string,
  searchColumn: string,
  searchValue: string | number,
  updateData: Record<string, string | number>
) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // 現在のデータを取得
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error("シートにデータがありません");
  }

  const headers = rows[0];
  const searchColumnIndex = headers.indexOf(searchColumn);
  
  if (searchColumnIndex === -1) {
    throw new Error(`カラム "${searchColumn}" が見つかりません`);
  }

  // 検索値に一致する行を探す
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][searchColumnIndex] == searchValue) {
      rowIndex = i + 1; // 1-indexed for Sheets API
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`値 "${searchValue}" が見つかりません`);
  }

  // 更新データを配列に変換
  const updateRow = headers.map((header) => {
    if (header in updateData) {
      return updateData[header];
    }
    return rows[rowIndex - 1][headers.indexOf(header)] || "";
  });

  // 行を更新
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [updateRow],
    },
  });

  return { rowIndex, updated: true };
}

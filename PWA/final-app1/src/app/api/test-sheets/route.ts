import { NextResponse } from "next/server";
import { getSheetData, getGoogleSheetsClient, getSpreadsheetId, SHEET_NAMES } from "@/lib/sheets";

/**
 * Google Sheets API 接続テスト
 * GET /api/test-sheets
 */
export async function GET() {
  try {
    // 環境変数のチェック
    const requiredEnvVars = [
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY",
      "GOOGLE_SPREADSHEET_ID",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `環境変数が設定されていません: ${missingVars.join(", ")}`,
          hint: "docs/setup-google-sheets-api.md を参照して設定してください",
        },
        { status: 500 }
      );
    }

    // スプレッドシートのメタデータを取得してシート名一覧を取得
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties.title",
    });

    const sheetNames = metadata.data.sheets?.map(
      (sheet) => sheet.properties?.title || ""
    ).filter(Boolean) || [];

    // 商品データを取得してテスト
    const products = await getSheetData(SHEET_NAMES.PRODUCTS);

    return NextResponse.json({
      success: true,
      message: "Google Sheets API 接続成功！",
      spreadsheetId: spreadsheetId,
      sheets: sheetNames,
      data: {
        serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        productCount: products.length,
      },
    });
  } catch (error) {
    console.error("Sheets API Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint: "スプレッドシートの共有設定とサービスアカウントのメールアドレスを確認してください",
      },
      { status: 500 }
    );
  }
}

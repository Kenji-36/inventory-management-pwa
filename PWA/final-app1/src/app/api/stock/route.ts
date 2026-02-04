import { NextResponse } from "next/server";
import { getSheetData, findAndUpdateRow, SHEET_NAMES } from "@/lib/sheets";

/**
 * 在庫情報を取得
 * GET /api/stock
 */
export async function GET() {
  try {
    const stockRaw = await getSheetData(SHEET_NAMES.STOCK);

    const stocks = stockRaw
      .filter((s) => s["在庫ID"])
      .map((s) => ({
        在庫ID: Number(s["在庫ID"]),
        商品ID: Number(s["商品ID"]),
        在庫数: Number(s["在庫数"]) || 0,
        最終入庫日: String(s["最終入庫日"] || ""),
        作成日: String(s["作成日"] || ""),
        更新日: String(s["更新日"] || ""),
      }));

    return NextResponse.json({
      success: true,
      data: stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error("Stock API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * 在庫数を更新
 * PUT /api/stock
 * 
 * Body:
 * - productId: 商品ID
 * - quantity: 新しい在庫数 または 増減値
 * - mode: "set" (絶対値設定) または "add" (増減)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity, mode = "set" } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: "productId と quantity は必須です" },
        { status: 400 }
      );
    }

    // 現在の在庫を取得
    const stockRaw = await getSheetData(SHEET_NAMES.STOCK);
    const currentStock = stockRaw.find(
      (s) => Number(s["商品ID"]) === productId
    );

    if (!currentStock) {
      return NextResponse.json(
        { success: false, error: "在庫情報が見つかりません" },
        { status: 404 }
      );
    }

    // 新しい在庫数を計算
    const currentQuantity = Number(currentStock["在庫数"]) || 0;
    const newQuantity =
      mode === "add" ? currentQuantity + quantity : quantity;

    // 在庫数が負にならないようにチェック
    if (newQuantity < 0) {
      return NextResponse.json(
        { success: false, error: "在庫数が不足しています" },
        { status: 400 }
      );
    }

    // 更新日時
    const now = new Date().toLocaleString("ja-JP");

    // スプレッドシートを更新
    await findAndUpdateRow(SHEET_NAMES.STOCK, "商品ID", productId, {
      在庫数: newQuantity,
      更新日: now,
    });

    return NextResponse.json({
      success: true,
      data: {
        productId,
        previousQuantity: currentQuantity,
        newQuantity,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error("Stock Update Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

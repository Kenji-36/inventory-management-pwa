import { NextResponse } from "next/server";
import { getSheetData, SHEET_NAMES } from "@/lib/sheets";
import type { Product, Stock, ProductWithStock } from "@/types";

/**
 * JANコードで商品を取得
 * GET /api/products/[jancode]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jancode: string }> }
) {
  try {
    const { jancode } = await params;

    // 商品データを取得
    const productsRaw = await getSheetData(SHEET_NAMES.PRODUCTS);
    const stockRaw = await getSheetData(SHEET_NAMES.STOCK);

    // JANコードで検索
    const productRaw = productsRaw.find(
      (p) => String(p["JANコード"]) === jancode
    );

    if (!productRaw) {
      return NextResponse.json(
        { success: false, error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    // 型変換
    const product: Product = {
      商品ID: Number(productRaw["商品ID"]),
      商品名: String(productRaw["商品名"] || ""),
      画像URL: String(productRaw["画像URL"] || ""),
      サイズ: String(productRaw["サイズ"] || ""),
      商品コード: String(productRaw["商品コード"] || ""),
      JANコード: String(productRaw["JANコード"] || ""),
      税抜価格: Number(productRaw["税抜価格"]) || 0,
      税込価格: Number(productRaw["税込価格"]) || 0,
      作成日: String(productRaw["作成日"] || ""),
      更新日: String(productRaw["更新日"] || ""),
    };

    // 在庫情報を取得
    const stockRawItem = stockRaw.find(
      (s) => Number(s["商品ID"]) === product.商品ID
    );

    const stock: Stock | null = stockRawItem
      ? {
          在庫ID: Number(stockRawItem["在庫ID"]),
          商品ID: Number(stockRawItem["商品ID"]),
          在庫数: Number(stockRawItem["在庫数"]) || 0,
          最終入庫日: String(stockRawItem["最終入庫日"] || ""),
          作成日: String(stockRawItem["作成日"] || ""),
          更新日: String(stockRawItem["更新日"] || ""),
        }
      : null;

    const productWithStock: ProductWithStock = {
      ...product,
      stock,
    };

    return NextResponse.json({
      success: true,
      data: productWithStock,
    });
  } catch (error) {
    console.error("Product API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSheetData, SHEET_NAMES } from "@/lib/sheets";
import type { Product, Stock, ProductWithStock, ProductGroup } from "@/types";

/**
 * 商品一覧を取得
 * GET /api/products
 * 
 * クエリパラメータ:
 * - search: 検索キーワード（商品名、商品コード、JANコード）
 * - grouped: true の場合、商品コードでグループ化
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const grouped = searchParams.get("grouped") === "true";

    // 商品データを取得
    const productsRaw = await getSheetData(SHEET_NAMES.PRODUCTS);
    const stockRaw = await getSheetData(SHEET_NAMES.STOCK);

    // 型変換
    const products: Product[] = productsRaw
      .filter((p) => p["商品ID"]) // 空行を除外
      .map((p) => ({
        商品ID: Number(p["商品ID"]),
        商品名: String(p["商品名"] || ""),
        画像URL: String(p["画像URL"] || ""),
        サイズ: String(p["サイズ"] || ""),
        商品コード: String(p["商品コード"] || ""),
        JANコード: String(p["JANコード"] || ""),
        税抜価格: Number(p["税抜価格"]) || 0,
        税込価格: Number(p["税込価格"]) || 0,
        作成日: String(p["作成日"] || ""),
        更新日: String(p["更新日"] || ""),
      }));

    const stocks: Stock[] = stockRaw
      .filter((s) => s["在庫ID"])
      .map((s) => ({
        在庫ID: Number(s["在庫ID"]),
        商品ID: Number(s["商品ID"]),
        在庫数: Number(s["在庫数"]) || 0,
        最終入庫日: String(s["最終入庫日"] || ""),
        作成日: String(s["作成日"] || ""),
        更新日: String(s["更新日"] || ""),
      }));

    // 商品と在庫を結合
    const productsWithStock: ProductWithStock[] = products.map((product) => ({
      ...product,
      stock: stocks.find((s) => s.商品ID === product.商品ID) || null,
    }));

    // 検索フィルタリング
    let filteredProducts = productsWithStock;
    if (search) {
      filteredProducts = productsWithStock.filter(
        (p) =>
          p.商品名.toLowerCase().includes(search) ||
          p.商品コード.toLowerCase().includes(search) ||
          p.JANコード.includes(search)
      );
    }

    // グループ化
    if (grouped) {
      const groupMap = new Map<string, ProductGroup>();

      filteredProducts.forEach((product) => {
        const code = product.商品コード;
        if (groupMap.has(code)) {
          const group = groupMap.get(code)!;
          group.variants.push(product);
          group.totalStock += product.stock?.在庫数 || 0;
        } else {
          groupMap.set(code, {
            商品コード: code,
            商品名: product.商品名,
            variants: [product],
            totalStock: product.stock?.在庫数 || 0,
          });
        }
      });

      return NextResponse.json({
        success: true,
        data: Array.from(groupMap.values()),
        count: groupMap.size,
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredProducts,
      count: filteredProducts.length,
    });
  } catch (error) {
    console.error("Products API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

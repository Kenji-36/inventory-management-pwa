import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { sanitizeString } from "@/lib/validation";
import type { Product, Stock, ProductWithStock, ProductGroup } from "@/types";

/**
 * 商品一覧を取得 または JANコードで商品を検索
 * GET /api/products
 * 
 * クエリパラメータ:
 * - search: 検索キーワード（商品名、商品コード、JANコード）
 * - grouped: true の場合、商品コードでグループ化
 * - id: 商品IDで検索
 * - jancode: JANコードで検索（完全一致）
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    // レート制限チェック
    const rateLimit = await checkRateLimit(`products-get-${auth.user.email}`, 60);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetTime);
    }
    const { searchParams } = new URL(request.url);
    const searchRaw = searchParams.get("search") || "";
    const search = sanitizeString(searchRaw).toLowerCase();
    const grouped = searchParams.get("grouped") === "true";
    const id = searchParams.get("id");
    const jancode = searchParams.get("jancode");

    // JANコードで検索（完全一致）
    if (jancode) {
      const { data: productData, error: productError } = await supabaseServer
        .from('products')
        .select('*, stock(*)')
        .eq('jan_code', jancode)
        .single();

      if (productError || !productData) {
        return NextResponse.json(
          { success: false, error: "商品が見つかりません" },
          { status: 404 }
        );
      }

      // stockの型を判定
      let stockRecord = null;
      if (productData.stock) {
        if (Array.isArray(productData.stock)) {
          stockRecord = productData.stock.length > 0 ? productData.stock[0] : null;
        } else {
          stockRecord = productData.stock;
        }
      }

      const productWithStock: ProductWithStock = {
        商品ID: productData.id,
        商品名: productData.name,
        画像URL: productData.image_url || "",
        サイズ: productData.size,
        商品コード: productData.product_code,
        JANコード: productData.jan_code,
        税抜価格: productData.price_excluding_tax,
        税込価格: productData.price_including_tax,
        作成日: productData.created_at,
        更新日: productData.updated_at,
        stock: stockRecord ? {
          在庫ID: stockRecord.id,
          商品ID: stockRecord.product_id,
          在庫数: stockRecord.quantity,
          最終入庫日: stockRecord.last_stocked_date || "",
          作成日: stockRecord.created_at,
          更新日: stockRecord.updated_at,
        } : null,
      };

      return NextResponse.json({
        success: true,
        data: productWithStock,
      });
    }

    // IDで検索
    if (id) {
      const { data: productData, error: productError } = await supabaseServer
        .from('products')
        .select('*, stock(*)')
        .eq('id', parseInt(id))
        .single();

      if (productError || !productData) {
        return NextResponse.json(
          { success: false, error: "商品が見つかりません" },
          { status: 404 }
        );
      }

      // stockの型を判定
      let stockRecord = null;
      if (productData.stock) {
        if (Array.isArray(productData.stock)) {
          stockRecord = productData.stock.length > 0 ? productData.stock[0] : null;
        } else {
          stockRecord = productData.stock;
        }
      }

      const productWithStock: ProductWithStock = {
        商品ID: productData.id,
        商品名: productData.name,
        画像URL: productData.image_url || "",
        サイズ: productData.size,
        商品コード: productData.product_code,
        JANコード: productData.jan_code,
        税抜価格: productData.price_excluding_tax,
        税込価格: productData.price_including_tax,
        作成日: productData.created_at,
        更新日: productData.updated_at,
        stock: stockRecord ? {
          在庫ID: stockRecord.id,
          商品ID: stockRecord.product_id,
          在庫数: stockRecord.quantity,
          最終入庫日: stockRecord.last_stocked_date || "",
          作成日: stockRecord.created_at,
          更新日: stockRecord.updated_at,
        } : null,
      };

      return NextResponse.json({
        success: true,
        data: [productWithStock],
      });
    }

    // Supabaseから商品データと在庫データを取得
    const { data: productsData, error: productsError } = await supabaseServer
      .from('products')
      .select('*, stock(*)')
      .order('id', { ascending: true });

    if (productsError) {
      throw productsError;
    }

    // 型変換（Supabase → 既存の型）
    const productsWithStock: ProductWithStock[] = (productsData || []).map((p: any, index: number) => {
      // Supabaseのstockは配列またはオブジェクトの可能性がある
      let stockRecord = null;
      if (p.stock) {
        if (Array.isArray(p.stock)) {
          // 配列の場合、最初の要素を取得
          stockRecord = p.stock.length > 0 ? p.stock[0] : null;
        } else {
          // オブジェクトの場合、そのまま使用
          stockRecord = p.stock;
        }
      }

      const stockData = stockRecord ? {
        在庫ID: stockRecord.id,
        商品ID: stockRecord.product_id,
        在庫数: stockRecord.quantity,
        最終入庫日: stockRecord.last_stocked_date || "",
        作成日: stockRecord.created_at,
        更新日: stockRecord.updated_at,
      } : null;

      return {
        商品ID: p.id,
        商品名: p.name,
        画像URL: p.image_url || "",
        サイズ: p.size,
        商品コード: p.product_code,
        JANコード: p.jan_code,
        税抜価格: p.price_excluding_tax,
        税込価格: p.price_including_tax,
        作成日: p.created_at,
        更新日: p.updated_at,
        stock: stockData,
      };
    });

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

      filteredProducts.forEach((product, index) => {
        const code = product.商品コード;
        const stockQuantity = product.stock?.在庫数 || 0;

        if (groupMap.has(code)) {
          const group = groupMap.get(code)!;
          group.variants.push(product);
          group.totalStock += stockQuantity;
        } else {
          groupMap.set(code, {
            商品コード: code,
            商品名: product.商品名,
            variants: [product],
            totalStock: stockQuantity,
          });
        }
      });

      const groupedData = Array.from(groupMap.values());

      return NextResponse.json({
        success: true,
        data: groupedData,
        count: groupMap.size,
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredProducts,
      count: filteredProducts.length,
    });
  } catch (error) {
    const { errorResponse } = await import("@/lib/error-handler");
    return errorResponse(error, "商品情報の取得に失敗しました");
  }
}

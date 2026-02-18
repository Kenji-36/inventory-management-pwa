import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import type { Order, OrderDetail, Product, Stock } from "@/types";

interface DailySales {
  date: string;
  totalOrders: number;
  totalSalesExclTax: number;
  totalSalesInclTax: number;
}

interface ProductSales {
  productId: number;
  productName: string;
  productCode: string;
  size: string;
  totalQuantity: number;
  totalSales: number;
}

interface DashboardData {
  // サマリー
  summary: {
    totalProducts: number;
    totalSKUs: number;
    outOfStock: number;
    lowStock: number;
    todayOrders: number;
    weekOrders: number;
    monthOrders: number;
    todaySales: number;
    weekSales: number;
    monthSales: number;
  };
  // 売上推移（直近30日）
  salesTrend: DailySales[];
  // 商品別売上ランキング（トップ10）
  topProducts: ProductSales[];
  // 在庫アラート商品
  stockAlerts: {
    productId: number;
    productName: string;
    size: string;
    stock: number;
  }[];
}

/**
 * ダッシュボードデータを取得
 * GET /api/dashboard
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) {
      return auth.response;
    }
    // レート制限チェック
    const rateLimit = await checkRateLimit(`dashboard-get-${auth.user.email}`, 60);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetTime);
    }
    
    // Supabaseから各テーブルのデータを取得
    // ⚠️ supabaseServerはService Role Keyを使用するため、RLSをバイパスします
    const [
      { data: productsData, error: productsError },
      { data: stockData, error: stockError },
      { data: ordersData, error: ordersError },
      { data: detailsData, error: detailsError },
    ] = await Promise.all([
      supabaseServer.from('products').select('id, name, size, product_code, jan_code, price_excluding_tax, price_including_tax'),
      supabaseServer.from('stock').select('id, product_id, quantity'),
      supabaseServer.from('orders').select('id, item_count, total_price_excluding_tax, total_price_including_tax, order_date'),
      supabaseServer.from('order_details').select('id, order_id, product_id, quantity, subtotal_including_tax'),
    ]);

    if (productsError || stockError || ordersError || detailsError) {
      throw productsError || stockError || ordersError || detailsError;
    }

    // 型変換（Supabase → 既存の型）
    const products: Product[] = (productsData || []).map((p: any) => ({
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
    }));

    const stocks: Stock[] = (stockData || []).map((s: any) => ({
      在庫ID: s.id,
      商品ID: s.product_id,
      在庫数: s.quantity,
      最終入庫日: s.last_stocked_date || "",
      作成日: s.created_at,
      更新日: s.updated_at,
    }));

    // 日付を正規化する関数（ISO 8601形式をYYYY-MM-DD形式に変換）
    const normalizeDate = (dateStr: string): string => {
      if (!dateStr) return "";
      // ISO 8601形式 "2026-02-06T09:08:14.000Z" → "2026-02-06"
      return dateStr.split("T")[0];
    };

    const orders: Order[] = (ordersData || []).map((o: any) => ({
      注文ID: o.id,
      商品数: o.item_count,
      "注文金額(税抜)": o.total_price_excluding_tax,
      "注文金額(税込)": o.total_price_including_tax,
      注文日: normalizeDate(o.order_date),
    }));

    const details: OrderDetail[] = (detailsData || []).map((d: any) => ({
      明細ID: d.id,
      注文ID: d.order_id,
      商品ID: d.product_id,
      数量: d.quantity,
      "単価(税抜)": d.unit_price_excluding_tax,
      "単価(税込)": d.unit_price_including_tax,
      "小計(税抜)": d.subtotal_excluding_tax,
      "小計(税込)": d.subtotal_including_tax,
      作成日: d.created_at,
      更新日: d.updated_at,
    }));

    // 日付計算
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // 在庫サマリー
    const totalProducts = products.length;
    const totalSKUs = new Set(products.map((p) => p.商品コード)).size;
    const outOfStock = stocks.filter((s) => s.在庫数 === 0).length;
    const lowStock = stocks.filter((s) => s.在庫数 > 0 && s.在庫数 < 3).length;

    // 注文サマリー（正規化された日付で比較）
    const todayOrders = orders.filter((o) => o.注文日 === today).length;
    const weekOrders = orders.filter((o) => o.注文日 >= weekAgo).length;
    const monthOrders = orders.filter((o) => o.注文日 >= monthStart).length;

    const todaySales = orders
      .filter((o) => o.注文日 === today)
      .reduce((sum, o) => sum + o["注文金額(税込)"], 0);
    const weekSales = orders
      .filter((o) => o.注文日 >= weekAgo)
      .reduce((sum, o) => sum + o["注文金額(税込)"], 0);
    const monthSales = orders
      .filter((o) => o.注文日 >= monthStart)
      .reduce((sum, o) => sum + o["注文金額(税込)"], 0);

    // デバッグ用: 注文データの日付を確認
    console.log("Orders dates:", orders.slice(0, 5).map((o: Order) => ({ id: o.注文ID, date: o.注文日, amount: o["注文金額(税込)"] })));

    // 売上推移（直近30日）
    const salesTrend: DailySales[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayOrders = orders.filter((o: Order) => o.注文日 === dateStr);

      salesTrend.push({
        date: dateStr,
        totalOrders: dayOrders.length,
        totalSalesExclTax: dayOrders.reduce((sum: number, o: Order) => sum + o["注文金額(税抜)"], 0),
        totalSalesInclTax: dayOrders.reduce((sum: number, o: Order) => sum + o["注文金額(税込)"], 0),
      });
    }

    // 商品別売上ランキング
    const productSalesMap = new Map<number, ProductSales>();
    details.forEach((d: OrderDetail) => {
      const product = products.find((p: Product) => p.商品ID === d.商品ID);
      if (!product) return;

      const existing = productSalesMap.get(d.商品ID);
      if (existing) {
        existing.totalQuantity += d.数量;
        existing.totalSales += d["小計(税込)"];
      } else {
        productSalesMap.set(d.商品ID, {
          productId: d.商品ID,
          productName: product.商品名,
          productCode: product.商品コード,
          size: product.サイズ,
          totalQuantity: d.数量,
          totalSales: d["小計(税込)"],
        });
      }
    });

    const topProducts = Array.from(productSalesMap.values())
      .sort((a: any, b: any) => b.totalSales - a.totalSales)
      .slice(0, 10);

    // 在庫アラート商品
    const stockAlerts = stocks
      .filter((s: Stock) => s.在庫数 < 3)
      .map((s: Stock) => {
        const product = products.find((p: Product) => p.商品ID === s.商品ID);
        return {
          productId: s.商品ID,
          productName: product?.商品名 || "不明",
          size: product?.サイズ || "",
          stock: s.在庫数,
        };
      })
      .sort((a: any, b: any) => a.stock - b.stock)
      .slice(0, 10);

    const dashboardData: DashboardData = {
      summary: {
        totalProducts,
        totalSKUs,
        outOfStock,
        lowStock,
        todayOrders,
        weekOrders,
        monthOrders,
        todaySales,
        weekSales,
        monthSales,
      },
      salesTrend,
      topProducts,
      stockAlerts,
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    const { errorResponse } = await import("@/lib/error-handler");
    return errorResponse(error, "ダッシュボードデータの取得に失敗しました");
  }
}

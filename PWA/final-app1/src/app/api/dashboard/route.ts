import { NextResponse } from "next/server";
import { getSheetData, SHEET_NAMES } from "@/lib/sheets";
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
    // 各シートからデータを取得
    const [productsRaw, stockRaw, ordersRaw, detailsRaw] = await Promise.all([
      getSheetData(SHEET_NAMES.PRODUCTS),
      getSheetData(SHEET_NAMES.STOCK),
      getSheetData(SHEET_NAMES.ORDERS),
      getSheetData(SHEET_NAMES.ORDER_DETAILS),
    ]);

    // 型変換
    const products: Product[] = productsRaw
      .filter((p) => p["商品ID"])
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

    const orders: Order[] = ordersRaw
      .filter((o) => o["注文ID"])
      .map((o) => ({
        注文ID: Number(o["注文ID"]),
        商品数: Number(o["商品数"]) || 0,
        "注文金額(税抜)": Number(String(o["注文金額(税抜)"]).replace(/[¥,]/g, "")) || 0,
        "注文金額(税込)": Number(String(o["注文金額(税込)"]).replace(/[¥,]/g, "")) || 0,
        注文日: String(o["注文日"] || ""),
      }));

    const details: OrderDetail[] = detailsRaw
      .filter((d) => d["明細ID"])
      .map((d) => ({
        明細ID: Number(d["明細ID"]),
        注文ID: Number(d["注文ID"]),
        商品ID: Number(d["商品ID"]),
        数量: Number(d["数量"]) || 0,
        "単価(税抜)": Number(String(d["単価(税抜)"]).replace(/[¥,]/g, "")) || 0,
        "単価(税込)": Number(String(d["単価(税込)"]).replace(/[¥,]/g, "")) || 0,
        "小計(税抜)": Number(String(d["小計(税抜)"]).replace(/[¥,]/g, "")) || 0,
        "小計(税込)": Number(String(d["小計(税込)"]).replace(/[¥,]/g, "")) || 0,
        作成日: String(d["作成日"] || ""),
        更新日: String(d["更新日"] || ""),
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

    // 注文サマリー
    const todayOrders = orders.filter((o) => o.注文日.startsWith(today)).length;
    const weekOrders = orders.filter((o) => o.注文日 >= weekAgo).length;
    const monthOrders = orders.filter((o) => o.注文日 >= monthStart).length;

    const todaySales = orders
      .filter((o) => o.注文日.startsWith(today))
      .reduce((sum, o) => sum + o["注文金額(税込)"], 0);
    const weekSales = orders
      .filter((o) => o.注文日 >= weekAgo)
      .reduce((sum, o) => sum + o["注文金額(税込)"], 0);
    const monthSales = orders
      .filter((o) => o.注文日 >= monthStart)
      .reduce((sum, o) => sum + o["注文金額(税込)"], 0);

    // 売上推移（直近30日）
    const salesTrend: DailySales[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const dayOrders = orders.filter((o) => o.注文日.startsWith(dateStr));

      salesTrend.push({
        date: dateStr,
        totalOrders: dayOrders.length,
        totalSalesExclTax: dayOrders.reduce((sum, o) => sum + o["注文金額(税抜)"], 0),
        totalSalesInclTax: dayOrders.reduce((sum, o) => sum + o["注文金額(税込)"], 0),
      });
    }

    // 商品別売上ランキング
    const productSalesMap = new Map<number, ProductSales>();
    details.forEach((d) => {
      const product = products.find((p) => p.商品ID === d.商品ID);
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
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    // 在庫アラート商品
    const stockAlerts = stocks
      .filter((s) => s.在庫数 < 3)
      .map((s) => {
        const product = products.find((p) => p.商品ID === s.商品ID);
        return {
          productId: s.商品ID,
          productName: product?.商品名 || "不明",
          size: product?.サイズ || "",
          stock: s.在庫数,
        };
      })
      .sort((a, b) => a.stock - b.stock)
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
    console.error("Dashboard API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

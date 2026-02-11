/**
 * 注文データのデバッグ用API
 * GET /api/debug-orders
 */

import { NextResponse } from "next/server";
import { getSheetData, SHEET_NAMES } from "@/lib/sheets";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  // 本番環境ではアクセス不可
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const adminResult = await requireAdmin();
  if (!adminResult.authenticated) {
    return adminResult.response;
  }

  try {
    const ordersRaw = await getSheetData(SHEET_NAMES.ORDERS);
    
    // 生データの最初の10件を返す
    const rawSample = ordersRaw.slice(0, 10);
    
    // 日付を正規化する関数
    const normalizeDate = (dateStr: string): string => {
      if (!dateStr) return "";
      const str = String(dateStr).trim();
      
      if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
        return str.slice(0, 10);
      }
      
      // "2026/1/15 6:41" または "2026/02/06" 形式 (YYYY/M/D または YYYY/MM/DD)
      const ymdSlashMatch = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
      if (ymdSlashMatch) {
        const [, year, month, day] = ymdSlashMatch;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      
      const mdyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (mdyMatch) {
        const [, month, day, year] = mdyMatch;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      
      const numValue = Number(str);
      if (!isNaN(numValue) && numValue > 40000 && numValue < 60000) {
        const date = new Date((numValue - 25569) * 86400 * 1000);
        return date.toISOString().split("T")[0];
      }
      
      return str;
    };

    // 正規化後のデータ
    const normalizedSample = ordersRaw.slice(0, 10).map((o: any) => ({
      注文ID: o["注文ID"],
      商品数: o["商品数"],
      "注文金額(税抜)_raw": o["注文金額(税抜)"],
      "注文金額(税込)_raw": o["注文金額(税込)"],
      "注文金額(税込)_parsed": Number(String(o["注文金額(税込)"]).replace(/[¥,]/g, "")) || 0,
      "注文日_raw": o["注文日"],
      "注文日_normalized": normalizeDate(String(o["注文日"] || "")),
    }));

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // 直近30日の注文数をカウント
    const recentOrders = ordersRaw.filter(o => {
      const normalizedDate = normalizeDate(String(o["注文日"] || ""));
      return normalizedDate >= thirtyDaysAgo;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalOrders: ordersRaw.filter(o => o["注文ID"]).length,
        recentOrdersCount: recentOrders.length,
        dateRange: {
          today,
          thirtyDaysAgo,
        },
        rawSample,
        normalizedSample,
      },
    });
  } catch (error) {
    console.error("Debug Orders API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

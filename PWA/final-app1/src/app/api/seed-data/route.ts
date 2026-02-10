/**
 * テスト用サンプルデータをGoogle Spreadsheetに追加するAPI
 * POST /api/seed-data
 */

import { NextResponse } from "next/server";
import { appendSheetData, getSheetData, SHEET_NAMES } from "@/lib/sheets";

export async function POST() {
  try {
    // 既存の注文IDを取得して最大値を確認
    const existingOrders = await getSheetData(SHEET_NAMES.ORDERS);
    const existingDetails = await getSheetData(SHEET_NAMES.ORDER_DETAILS);
    
    // 最大IDを取得
    const maxOrderId = existingOrders.length > 0 
      ? Math.max(...existingOrders.filter(o => o["注文ID"]).map(o => Number(o["注文ID"])))
      : 1000;
    
    const maxDetailId = existingDetails.length > 0
      ? Math.max(...existingDetails.filter(d => d["明細ID"]).map(d => Number(d["明細ID"])))
      : 1000;

    // 商品データを取得
    const products = await getSheetData(SHEET_NAMES.PRODUCTS);
    const productList = products.filter(p => p["商品ID"]).slice(0, 10);

    if (productList.length === 0) {
      return NextResponse.json({
        success: false,
        error: "商品データがありません",
      }, { status: 400 });
    }

    // 直近30日分のサンプルデータを作成
    const now = new Date();
    const ordersToAdd: (string | number)[][] = [];
    const detailsToAdd: (string | number)[][] = [];
    
    let orderId = maxOrderId + 1;
    let detailId = maxDetailId + 1;

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().replace("T", " ").slice(0, 19);
      
      // 1日あたり1〜3件の注文をランダムに作成
      const orderCount = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < orderCount; j++) {
        // ランダムに商品を選択（1〜4商品）
        const itemCount = Math.floor(Math.random() * 4) + 1;
        const selectedProducts = [...productList]
          .sort(() => Math.random() - 0.5)
          .slice(0, itemCount);
        
        let orderTotalExclTax = 0;
        let orderTotalInclTax = 0;
        let totalQuantity = 0;
        
        // 注文詳細を作成
        for (const product of selectedProducts) {
          const quantity = Math.floor(Math.random() * 3) + 1;
          const priceExclTax = Number(product["税抜価格"]) || 1000;
          const priceInclTax = Number(product["税込価格"]) || 1100;
          const subtotalExclTax = priceExclTax * quantity;
          const subtotalInclTax = priceInclTax * quantity;
          
          detailsToAdd.push([
            detailId,                    // 明細ID
            orderId,                     // 注文ID
            Number(product["商品ID"]),   // 商品ID
            quantity,                    // 数量
            priceExclTax,               // 単価(税抜)
            priceInclTax,               // 単価(税込)
            subtotalExclTax,            // 小計(税抜)
            subtotalInclTax,            // 小計(税込)
            dateStr,                    // 作成日
            dateStr,                    // 更新日
          ]);
          
          orderTotalExclTax += subtotalExclTax;
          orderTotalInclTax += subtotalInclTax;
          totalQuantity += quantity;
          detailId++;
        }
        
        // 注文情報を作成
        ordersToAdd.push([
          orderId,                    // 注文ID
          totalQuantity,              // 商品数
          `¥${orderTotalExclTax.toLocaleString()}`,  // 注文金額(税抜)
          `¥${orderTotalInclTax.toLocaleString()}`,  // 注文金額(税込)
          dateStr,                    // 注文日
        ]);
        
        orderId++;
      }
    }

    // Google Spreadsheetに追加
    if (ordersToAdd.length > 0) {
      await appendSheetData(SHEET_NAMES.ORDERS, ordersToAdd);
    }
    
    if (detailsToAdd.length > 0) {
      await appendSheetData(SHEET_NAMES.ORDER_DETAILS, detailsToAdd);
    }

    return NextResponse.json({
      success: true,
      message: `${ordersToAdd.length}件の注文と${detailsToAdd.length}件の明細を追加しました`,
      data: {
        ordersAdded: ordersToAdd.length,
        detailsAdded: detailsToAdd.length,
      },
    });
  } catch (error) {
    console.error("Seed Data API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GETでデータ状況を確認
export async function GET() {
  try {
    const orders = await getSheetData(SHEET_NAMES.ORDERS);
    const details = await getSheetData(SHEET_NAMES.ORDER_DETAILS);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
    
    const recentOrders = orders.filter(o => {
      const orderDate = String(o["注文日"] || "").split(" ")[0];
      return orderDate >= thirtyDaysAgoStr;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalOrders: orders.filter(o => o["注文ID"]).length,
        totalDetails: details.filter(d => d["明細ID"]).length,
        recentOrders: recentOrders.length,
        dateRange: {
          from: thirtyDaysAgoStr,
          to: now.toISOString().split("T")[0],
        },
      },
    });
  } catch (error) {
    console.error("Seed Data API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  getSheetData,
  appendSheetData,
  findAndUpdateRow,
  SHEET_NAMES,
} from "@/lib/sheets";
import type { Order, OrderDetail } from "@/types";

/**
 * 注文一覧を取得
 * GET /api/orders
 */
export async function GET() {
  try {
    const ordersRaw = await getSheetData(SHEET_NAMES.ORDERS);

    const orders: Order[] = ordersRaw
      .filter((o) => o["注文ID"])
      .map((o) => ({
        注文ID: Number(o["注文ID"]),
        商品数: Number(o["商品数"]) || 0,
        "注文金額(税抜)": Number(String(o["注文金額(税抜)"]).replace(/[¥,]/g, "")) || 0,
        "注文金額(税込)": Number(String(o["注文金額(税込)"]).replace(/[¥,]/g, "")) || 0,
        注文日: String(o["注文日"] || ""),
      }));

    // 注文日で降順ソート
    orders.sort((a, b) => {
      return new Date(b.注文日).getTime() - new Date(a.注文日).getTime();
    });

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("Orders API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * 新規注文を作成
 * POST /api/orders
 * 
 * Body:
 * - items: Array<{ productId, quantity, unitPriceExclTax, unitPriceInclTax }>
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "注文商品が指定されていません" },
        { status: 400 }
      );
    }

    // 既存の注文を取得して次のIDを決定
    const ordersRaw = await getSheetData(SHEET_NAMES.ORDERS);
    const detailsRaw = await getSheetData(SHEET_NAMES.ORDER_DETAILS);

    const maxOrderId = ordersRaw.reduce((max, o) => {
      const id = Number(o["注文ID"]) || 0;
      return id > max ? id : max;
    }, 0);

    const maxDetailId = detailsRaw.reduce((max, d) => {
      const id = Number(d["明細ID"]) || 0;
      return id > max ? id : max;
    }, 0);

    const newOrderId = maxOrderId + 1;
    const now = new Date().toLocaleString("ja-JP");

    // 注文詳細を作成
    let totalQuantity = 0;
    let totalExclTax = 0;
    let totalInclTax = 0;
    const detailRows: (string | number)[][] = [];

    items.forEach((item: {
      productId: number;
      quantity: number;
      unitPriceExclTax: number;
      unitPriceInclTax: number;
    }, index: number) => {
      const detailId = maxDetailId + index + 1;
      const subtotalExclTax = item.quantity * item.unitPriceExclTax;
      const subtotalInclTax = item.quantity * item.unitPriceInclTax;

      totalQuantity += item.quantity;
      totalExclTax += subtotalExclTax;
      totalInclTax += subtotalInclTax;

      detailRows.push([
        detailId,                    // 明細ID
        newOrderId,                  // 注文ID
        item.productId,              // 商品ID
        item.quantity,               // 数量
        item.unitPriceExclTax,       // 単価(税抜)
        item.unitPriceInclTax,       // 単価(税込)
        subtotalExclTax,             // 小計(税抜)
        subtotalInclTax,             // 小計(税込)
        now,                         // 作成日
        now,                         // 更新日
      ]);
    });

    // 注文情報を作成
    const orderRow = [
      newOrderId,           // 注文ID
      totalQuantity,        // 商品数
      totalExclTax,         // 注文金額(税抜)
      totalInclTax,         // 注文金額(税込)
      now,                  // 注文日
    ];

    // スプレッドシートに追加
    await appendSheetData(SHEET_NAMES.ORDERS, [orderRow]);
    await appendSheetData(SHEET_NAMES.ORDER_DETAILS, detailRows);

    // 在庫を減らす
    for (const item of items) {
      try {
        await findAndUpdateRow(
          SHEET_NAMES.STOCK,
          "商品ID",
          item.productId,
          {
            在庫数:
              (await getStockQuantity(item.productId)) - item.quantity,
            更新日: now,
          }
        );
      } catch (e) {
        console.warn(`在庫更新スキップ: 商品ID ${item.productId}`, e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: newOrderId,
        totalQuantity,
        totalExclTax,
        totalInclTax,
        itemCount: items.length,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Order Create Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 在庫数を取得するヘルパー関数
async function getStockQuantity(productId: number): Promise<number> {
  const stockRaw = await getSheetData(SHEET_NAMES.STOCK);
  const stock = stockRaw.find((s) => Number(s["商品ID"]) === productId);
  return stock ? Number(stock["在庫数"]) || 0 : 0;
}

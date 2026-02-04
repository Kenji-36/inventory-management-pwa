import { NextResponse } from "next/server";
import { getSheetData, SHEET_NAMES } from "@/lib/sheets";
import type { Order, OrderDetail, Product, OrderWithDetails } from "@/types";

/**
 * 注文詳細を取得
 * GET /api/orders/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "無効な注文IDです" },
        { status: 400 }
      );
    }

    // 注文情報を取得
    const ordersRaw = await getSheetData(SHEET_NAMES.ORDERS);
    const detailsRaw = await getSheetData(SHEET_NAMES.ORDER_DETAILS);
    const productsRaw = await getSheetData(SHEET_NAMES.PRODUCTS);

    // 注文を検索
    const orderRaw = ordersRaw.find(
      (o) => Number(o["注文ID"]) === orderId
    );

    if (!orderRaw) {
      return NextResponse.json(
        { success: false, error: "注文が見つかりません" },
        { status: 404 }
      );
    }

    // 注文情報を型変換
    const order: Order = {
      注文ID: Number(orderRaw["注文ID"]),
      商品数: Number(orderRaw["商品数"]) || 0,
      "注文金額(税抜)": Number(String(orderRaw["注文金額(税抜)"]).replace(/[¥,]/g, "")) || 0,
      "注文金額(税込)": Number(String(orderRaw["注文金額(税込)"]).replace(/[¥,]/g, "")) || 0,
      注文日: String(orderRaw["注文日"] || ""),
    };

    // 注文詳細を取得
    const orderDetails: (OrderDetail & { product?: Product })[] = detailsRaw
      .filter((d) => Number(d["注文ID"]) === orderId)
      .map((d) => {
        const productRaw = productsRaw.find(
          (p) => Number(p["商品ID"]) === Number(d["商品ID"])
        );

        const product: Product | undefined = productRaw
          ? {
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
            }
          : undefined;

        return {
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
          product,
        };
      });

    const orderWithDetails: OrderWithDetails = {
      ...order,
      details: orderDetails,
    };

    return NextResponse.json({
      success: true,
      data: orderWithDetails,
    });
  } catch (error) {
    console.error("Order Detail API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import type { Product } from "@/types";

/**
 * CSVダウンロード
 * GET /api/csv/download
 * 
 * クエリパラメータ:
 * - type: "template" (空のテンプレート) または "data" (現在のデータ)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "template";

    // CSVヘッダー
    const headers = [
      "商品ID",
      "商品名",
      "画像URL",
      "サイズ",
      "商品コード",
      "JANコード",
      "税抜価格",
      "税込価格",
    ];

    let csvContent = "";

    if (type === "template") {
      // 空のテンプレート（ヘッダーのみ + サンプル2行）
      csvContent = [
        headers.join(","),
        ",サンプル商品,,S,SKU-001,4500000000001,1000,1100",
        ",サンプル商品,,M,SKU-001,4500000000002,1000,1100",
      ].join("\n");
    } else {
      // Supabaseから現在のデータをエクスポート
      const { data: productsData, error: productsError } = await supabaseServer
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (productsError) {
        throw productsError;
      }

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

      const rows = products.map((p) =>
        [
          p.商品ID,
          `"${p.商品名.replace(/"/g, '""')}"`,
          p.画像URL,
          p.サイズ,
          p.商品コード,
          p.JANコード,
          p.税抜価格,
          p.税込価格,
        ].join(",")
      );

      csvContent = [headers.join(","), ...rows].join("\n");
    }

    // BOMを追加してExcelでの文字化けを防ぐ
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    const filename =
      type === "template"
        ? "product_template.csv"
        : `products_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV Download Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

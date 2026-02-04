import { NextResponse } from "next/server";
import { getSheetData, appendSheetData, updateSheetData, SHEET_NAMES } from "@/lib/sheets";

interface CsvProduct {
  商品ID?: number;
  商品名: string;
  画像URL?: string;
  サイズ: string;
  商品コード: string;
  JANコード: string;
  税抜価格: number;
  税込価格: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * CSVアップロード・インポート
 * POST /api/csv/upload
 * 
 * リクエストボディ: FormData (file: CSV file)
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    // ファイルを読み取り
    const text = await file.text();
    
    // BOMを除去
    const cleanText = text.replace(/^\uFEFF/, "");
    
    // CSVをパース
    const lines = cleanText.split(/\r?\n/).filter((line) => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: "データが含まれていません" },
        { status: 400 }
      );
    }

    // ヘッダー行を取得
    const headers = parseCSVLine(lines[0]);
    const expectedHeaders = [
      "商品ID",
      "商品名",
      "画像URL",
      "サイズ",
      "商品コード",
      "JANコード",
      "税抜価格",
      "税込価格",
    ];

    // ヘッダー検証
    const missingHeaders = expectedHeaders.filter(
      (h) => !headers.includes(h)
    );
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `必須カラムがありません: ${missingHeaders.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // データ行をパース
    const products: CsvProduct[] = [];
    const errors: ValidationError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      // バリデーション
      const rowNum = i + 1;

      if (!row["商品名"]?.trim()) {
        errors.push({ row: rowNum, field: "商品名", message: "商品名は必須です" });
      }
      if (!row["サイズ"]?.trim()) {
        errors.push({ row: rowNum, field: "サイズ", message: "サイズは必須です" });
      }
      if (!row["商品コード"]?.trim()) {
        errors.push({ row: rowNum, field: "商品コード", message: "商品コードは必須です" });
      }
      if (!row["JANコード"]?.trim()) {
        errors.push({ row: rowNum, field: "JANコード", message: "JANコードは必須です" });
      }
      if (!row["税抜価格"] || isNaN(Number(row["税抜価格"]))) {
        errors.push({ row: rowNum, field: "税抜価格", message: "税抜価格は数値で入力してください" });
      }
      if (!row["税込価格"] || isNaN(Number(row["税込価格"]))) {
        errors.push({ row: rowNum, field: "税込価格", message: "税込価格は数値で入力してください" });
      }

      if (errors.filter((e) => e.row === rowNum).length === 0) {
        products.push({
          商品ID: row["商品ID"] ? Number(row["商品ID"]) : undefined,
          商品名: row["商品名"].trim(),
          画像URL: row["画像URL"]?.trim() || "",
          サイズ: row["サイズ"].trim(),
          商品コード: row["商品コード"].trim(),
          JANコード: row["JANコード"].trim(),
          税抜価格: Number(row["税抜価格"]),
          税込価格: Number(row["税込価格"]),
        });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "バリデーションエラーがあります",
          validationErrors: errors,
        },
        { status: 400 }
      );
    }

    // 既存データを取得
    const existingData = await getSheetData(SHEET_NAMES.PRODUCTS);
    const existingProducts = existingData.filter((p) => p["商品ID"]);

    // 最大IDを取得
    let maxId = Math.max(
      0,
      ...existingProducts.map((p) => Number(p["商品ID"]) || 0)
    );

    const now = new Date().toISOString();
    let updatedCount = 0;
    let addedCount = 0;

    for (const product of products) {
      if (product.商品ID) {
        // 既存商品の更新
        const rowIndex = existingProducts.findIndex(
          (p) => Number(p["商品ID"]) === product.商品ID
        );

        if (rowIndex !== -1) {
          const sheetRow = rowIndex + 2; // ヘッダー行 + 1-indexed
          await updateSheetData(SHEET_NAMES.PRODUCTS, `A${sheetRow}:J${sheetRow}`, [
            [
              product.商品ID,
              product.商品名,
              product.画像URL || "",
              product.サイズ,
              product.商品コード,
              product.JANコード,
              product.税抜価格,
              product.税込価格,
              existingProducts[rowIndex]["作成日"] || now,
              now,
            ],
          ]);
          updatedCount++;
        }
      } else {
        // 新規商品の追加
        maxId++;
        await appendSheetData(SHEET_NAMES.PRODUCTS, [
          [
            maxId,
            product.商品名,
            product.画像URL || "",
            product.サイズ,
            product.商品コード,
            product.JANコード,
            product.税抜価格,
            product.税込価格,
            now,
            now,
          ],
        ]);

        // 在庫情報も初期化
        const stockData = await getSheetData(SHEET_NAMES.STOCK);
        const maxStockId = Math.max(
          0,
          ...stockData.filter((s) => s["在庫ID"]).map((s) => Number(s["在庫ID"]) || 0)
        );

        await appendSheetData(SHEET_NAMES.STOCK, [
          [maxStockId + 1, maxId, 0, "", now, now],
        ]);

        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `処理完了: ${addedCount}件追加、${updatedCount}件更新`,
      added: addedCount,
      updated: updatedCount,
    });
  } catch (error) {
    console.error("CSV Upload Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * CSV行をパース（ダブルクォート対応）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされたダブルクォート
        current += '"';
        i++;
      } else {
        // クォートの開始/終了
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // フィールドの区切り
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // 最後のフィールド
  result.push(current.trim());

  return result;
}

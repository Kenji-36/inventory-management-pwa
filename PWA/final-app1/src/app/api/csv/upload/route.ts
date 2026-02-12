import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { validateProduct, validateFileSize, sanitizeString } from "@/lib/validation";

interface CsvProduct {
  商品ID?: number;
  商品名: string;
  画像URL?: string;
  サイズ: string;
  商品コード: string;
  JANコード: string;
  税抜価格: number;
  税込価格: number;
  在庫数量?: number;
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
  // セッション検証
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }

  // レート制限チェック（CSV アップロードは厳しく制限）
  const rateLimit = await checkRateLimit(`csv-upload-${auth.user.email}`, 5, 60000);
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.resetTime);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    // ファイルサイズ検証（5MB制限）
    const sizeCheck = validateFileSize(file.size, 5);
    if (!sizeCheck.valid) {
      return NextResponse.json(
        { success: false, error: sizeCheck.error },
        { status: 400 }
      );
    }

    // ファイルタイプ検証
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { success: false, error: "CSVファイルのみアップロード可能です" },
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
    const requiredHeaders = [
      "商品ID",
      "商品名",
      "画像URL",
      "サイズ",
      "商品コード",
      "JANコード",
      "税抜価格",
      "税込価格",
    ];
    const optionalHeaders = ["在庫数量"];

    // 必須ヘッダー検証
    const missingHeaders = requiredHeaders.filter(
      (h: any) => !headers.includes(h)
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

    // 行数制限チェック（最大1000行）
    if (lines.length > 1001) {
      return NextResponse.json(
        { success: false, error: "CSVファイルの行数が多すぎます（最大1000行）" },
        { status: 400 }
      );
    }

    // データ行をパース
    const products: CsvProduct[] = [];
    const errors: ValidationError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      
      headers.forEach((header: any, index: any) => {
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

      if (errors.filter((e: any) => e.row === rowNum).length === 0) {
        const product = {
          商品ID: row["商品ID"] ? Number(row["商品ID"]) : undefined,
          商品名: sanitizeString(row["商品名"]),
          画像URL: sanitizeString(row["画像URL"] || ""),
          サイズ: sanitizeString(row["サイズ"]),
          商品コード: sanitizeString(row["商品コード"]),
          JANコード: sanitizeString(row["JANコード"]),
          税抜価格: Number(row["税抜価格"]),
          税込価格: Number(row["税込価格"]),
          在庫数量: row["在庫数量"] && !isNaN(Number(row["在庫数量"])) ? Number(row["在庫数量"]) : undefined,
        };

        // 商品データの詳細検証
        const productValidation = validateProduct(product);
        if (!productValidation.valid) {
          productValidation.errors.forEach((err: any) => {
            errors.push({ row: rowNum, field: "商品データ", message: err });
          });
        } else {
          products.push(product);
        }
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

    // Supabaseで商品データをupsert（存在すれば更新、なければ挿入）
    let updatedCount = 0;
    let addedCount = 0;
    const processingErrors: string[] = [];

    for (const product of products) {
      if (product.商品ID) {
        // 既存商品の更新
        const { data, error } = await supabaseServer
          .from('products')
          .update({
            name: product.商品名,
            image_url: product.画像URL || null,
            size: product.サイズ,
            product_code: product.商品コード,
            jan_code: product.JANコード,
            price_excluding_tax: product.税抜価格,
            price_including_tax: product.税込価格,
          })
          .eq('id', product.商品ID)
          .select();

        if (error) {
          const errorMsg = `商品ID ${product.商品ID} の更新に失敗: ${error.message}`;
          processingErrors.push(errorMsg);
        } else if (data && data.length > 0) {
          updatedCount++;
          
          // 在庫数量が指定されている場合は在庫も更新
          if (product.在庫数量 !== undefined) {
            const { error: stockError } = await supabaseServer
              .from('stock')
              .update({
                quantity: product.在庫数量,
                last_stocked_date: new Date().toISOString(),
              })
              .eq('product_id', product.商品ID);
            
            if (stockError) {
              const warnMsg = `商品ID ${product.商品ID} の在庫更新に失敗: ${stockError.message}`;
              processingErrors.push(warnMsg);
            }
          }
        } else {
          const warnMsg = `商品ID ${product.商品ID} が見つかりませんでした`;
          processingErrors.push(warnMsg);
        }
      } else {
        // 新規商品の追加
        const { data: newProduct, error: productError } = await supabaseServer
          .from('products')
          .insert({
            name: product.商品名,
            image_url: product.画像URL || null,
            size: product.サイズ,
            product_code: product.商品コード,
            jan_code: product.JANコード,
            price_excluding_tax: product.税抜価格,
            price_including_tax: product.税込価格,
          })
          .select()
          .single();

        if (productError || !newProduct) {
          let errorMsg = `商品の追加に失敗: ${product.商品名}`;
          if (productError?.code === '23505') {
            // UNIQUE制約違反
            if (productError.message.includes('jan_code')) {
              errorMsg += ` - JANコード「${product.JANコード}」は既に登録されています`;
            } else if (productError.message.includes('product_code')) {
              errorMsg += ` - 商品コード「${product.商品コード}」は既に登録されています`;
            } else {
              errorMsg += ` - 重複エラー: ${productError.message}`;
            }
          } else {
            errorMsg += ` - ${productError?.message}`;
          }
          processingErrors.push(errorMsg);
          continue;
        }

        // 在庫情報も初期化
        const stockQuantity = product.在庫数量 !== undefined ? product.在庫数量 : 0;
        await supabaseServer.from('stock').insert({
          product_id: newProduct.id,
          quantity: stockQuantity,
          last_stocked_date: stockQuantity > 0 ? new Date().toISOString() : null,
        });

        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `処理完了: ${addedCount}件追加、${updatedCount}件更新${processingErrors.length > 0 ? `、${processingErrors.length}件エラー` : ''}`,
      added: addedCount,
      updated: updatedCount,
      processingErrors: processingErrors.length > 0 ? processingErrors : undefined,
    });
  } catch (error) {
    const { errorResponse } = await import("@/lib/error-handler");
    return errorResponse(error, "CSVのアップロードに失敗しました");
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

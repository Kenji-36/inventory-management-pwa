/**
 * 入力値検証ユーティリティ
 */

/**
 * 数値の範囲検証
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): { valid: boolean; error?: string } {
  if (typeof value !== "number" || isNaN(value)) {
    return { valid: false, error: `${fieldName}は数値である必要があります` };
  }
  
  if (value < min) {
    return { valid: false, error: `${fieldName}は${min}以上である必要があります` };
  }
  
  if (value > max) {
    return { valid: false, error: `${fieldName}は${max}以下である必要があります` };
  }
  
  return { valid: true };
}

/**
 * 文字列の長さ検証
 */
export function validateStringLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): { valid: boolean; error?: string } {
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName}は文字列である必要があります` };
  }
  
  const length = value.trim().length;
  
  if (length < min) {
    return { valid: false, error: `${fieldName}は${min}文字以上である必要があります` };
  }
  
  if (length > max) {
    return { valid: false, error: `${fieldName}は${max}文字以下である必要があります` };
  }
  
  return { valid: true };
}

/**
 * JANコードの検証（13桁または8桁）
 */
export function validateJANCode(code: string): { valid: boolean; error?: string } {
  if (!code || typeof code !== "string") {
    return { valid: false, error: "JANコードは必須です" };
  }
  
  const cleaned = code.trim();
  
  if (!/^\d{8}$|^\d{13}$/.test(cleaned)) {
    return { valid: false, error: "JANコードは8桁または13桁の数字である必要があります" };
  }
  
  return { valid: true };
}

/**
 * 価格の検証
 */
export function validatePrice(price: number): { valid: boolean; error?: string } {
  if (typeof price !== "number" || isNaN(price)) {
    return { valid: false, error: "価格は数値である必要があります" };
  }
  
  if (price < 0) {
    return { valid: false, error: "価格は0以上である必要があります" };
  }
  
  if (price > 10000000) {
    return { valid: false, error: "価格が異常に高額です" };
  }
  
  return { valid: true };
}

/**
 * 在庫数の検証
 */
export function validateStockQuantity(quantity: number): { valid: boolean; error?: string } {
  if (typeof quantity !== "number" || isNaN(quantity)) {
    return { valid: false, error: "在庫数は数値である必要があります" };
  }
  
  if (quantity < 0) {
    return { valid: false, error: "在庫数は0以上である必要があります" };
  }
  
  if (quantity > 100000) {
    return { valid: false, error: "在庫数が異常に多いです" };
  }
  
  return { valid: true };
}

/**
 * 注文数量の検証
 */
export function validateOrderQuantity(quantity: number): { valid: boolean; error?: string } {
  if (typeof quantity !== "number" || isNaN(quantity)) {
    return { valid: false, error: "数量は数値である必要があります" };
  }
  
  if (quantity < 1) {
    return { valid: false, error: "数量は1以上である必要があります" };
  }
  
  if (quantity > 10000) {
    return { valid: false, error: "数量が異常に多いです" };
  }
  
  return { valid: true };
}

/**
 * ファイルサイズの検証
 */
export function validateFileSize(
  size: number,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (size > maxBytes) {
    return {
      valid: false,
      error: `ファイルサイズは${maxSizeMB}MB以下である必要があります`,
    };
  }
  
  return { valid: true };
}

/**
 * 文字列のサニタイゼーション（基本的なXSS対策）
 */
export function sanitizeString(value: string): string {
  if (typeof value !== "string") return "";
  
  return value
    .trim()
    .replace(/[<>]/g, "") // タグの除去
    .replace(/javascript:/gi, "") // javascript: プロトコルの除去
    .replace(/on\w+=/gi, ""); // イベントハンドラの除去
}

/**
 * 商品データの検証
 */
export function validateProduct(product: {
  商品名: string;
  サイズ: string;
  商品コード: string;
  JANコード: string;
  税抜価格: number;
  税込価格: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const nameCheck = validateStringLength(product.商品名, 1, 100, "商品名");
  if (!nameCheck.valid) errors.push(nameCheck.error!);
  
  const sizeCheck = validateStringLength(product.サイズ, 1, 20, "サイズ");
  if (!sizeCheck.valid) errors.push(sizeCheck.error!);
  
  const codeCheck = validateStringLength(product.商品コード, 1, 50, "商品コード");
  if (!codeCheck.valid) errors.push(codeCheck.error!);
  
  const janCheck = validateJANCode(product.JANコード);
  if (!janCheck.valid) errors.push(janCheck.error!);
  
  const priceExclCheck = validatePrice(product.税抜価格);
  if (!priceExclCheck.valid) errors.push(priceExclCheck.error!);
  
  const priceInclCheck = validatePrice(product.税込価格);
  if (!priceInclCheck.valid) errors.push(priceInclCheck.error!);
  
  // 税込価格が税抜価格より大きいことを確認
  if (product.税込価格 <= product.税抜価格) {
    errors.push("税込価格は税抜価格より大きい必要があります");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

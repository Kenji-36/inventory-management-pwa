// 商品型定義
export interface Product {
  商品ID: number;
  商品名: string;
  画像URL: string;
  サイズ: string;
  商品コード: string;
  JANコード: string;
  税抜価格: number;
  税込価格: number;
  作成日: string;
  更新日: string;
}

// 在庫情報型定義
export interface Stock {
  在庫ID: number;
  商品ID: number;
  在庫数: number;
  最終入庫日: string;
  作成日: string;
  更新日: string;
}

// 商品と在庫を結合した型
export interface ProductWithStock extends Product {
  stock: Stock | null;
}

// SKUグループ（商品コードでグループ化）
export interface ProductGroup {
  商品コード: string;
  商品名: string;
  variants: ProductWithStock[];
  totalStock: number;
}

// 注文情報型定義
export interface Order {
  注文ID: number;
  商品数: number;
  "注文金額(税抜)": number;
  "注文金額(税込)": number;
  注文日: string;
}

// 注文詳細型定義
export interface OrderDetail {
  明細ID: number;
  注文ID: number;
  商品ID: number;
  数量: number;
  "単価(税抜)": number;
  "単価(税込)": number;
  "小計(税抜)": number;
  "小計(税込)": number;
  作成日: string;
  更新日: string;
}

// 注文と詳細を結合した型
export interface OrderWithDetails extends Order {
  details: (OrderDetail & { product?: Product })[];
}

// ユーザマスタ型定義
export interface User {
  idno: number;
  user_id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

// ダッシュボード用売上サマリー
export interface SalesSummary {
  date: string;
  totalOrders: number;
  totalSalesExclTax: number;
  totalSalesInclTax: number;
}

// カート内アイテム（注文作成時）
export interface CartItem {
  product: Product;
  quantity: number;
  subtotalExclTax: number;
  subtotalInclTax: number;
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

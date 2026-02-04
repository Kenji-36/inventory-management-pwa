"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Package } from "lucide-react";

interface ProductSales {
  productId: number;
  productName: string;
  productCode: string;
  size: string;
  totalQuantity: number;
  totalSales: number;
}

interface ProductRankingProps {
  products: ProductSales[];
}

export function ProductRanking({ products }: ProductRankingProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            売上ランキング
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>売上データがありません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 総売上を計算
  const totalSales = products.reduce((sum, p) => sum + p.totalSales, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          売上ランキング（TOP 10）
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product, index) => {
            const percentage = totalSales > 0 ? (product.totalSales / totalSales) * 100 : 0;

            return (
              <div
                key={product.productId}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* 順位 */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-700"
                      : index === 1
                      ? "bg-gray-200 text-gray-700"
                      : index === 2
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>

                {/* 商品情報 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{product.productName}</div>
                  <div className="text-sm text-gray-500">
                    {product.productCode} / {product.size}
                  </div>
                </div>

                {/* 売上情報 */}
                <div className="text-right">
                  <div className="font-bold">
                    ¥{product.totalSales.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {product.totalQuantity}個 ({percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

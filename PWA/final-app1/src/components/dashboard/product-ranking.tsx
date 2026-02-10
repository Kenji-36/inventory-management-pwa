"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Package, Crown, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            売上ランキング
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">売上データがありません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSales = products.reduce((sum, p) => sum + p.totalSales, 0);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-4 h-4" />;
      case 1:
        return <Medal className="w-4 h-4" />;
      case 2:
        return <Award className="w-4 h-4" />;
      default:
        return index + 1;
    }
  };

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30";
      case 1:
        return "bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-lg shadow-gray-400/30";
      case 2:
        return "bg-gradient-to-br from-orange-300 to-amber-400 text-white shadow-lg shadow-orange-400/30";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <span>売上ランキング</span>
            <span className="text-sm font-normal text-gray-500 ml-2">TOP {products.length}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {products.map((product, index) => {
            const percentage = totalSales > 0 ? (product.totalSales / totalSales) * 100 : 0;

            return (
              <div
                key={product.productId}
                className={cn(
                  "flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors fade-in",
                  index < 3 && "bg-gradient-to-r from-amber-50/30 to-transparent"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* 順位 */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                    getRankStyle(index)
                  )}
                >
                  {getRankIcon(index)}
                </div>

                {/* 商品情報 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{product.productName}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span>{product.productCode}</span>
                    <span className="badge badge-primary text-xs">{product.size}</span>
                  </div>
                </div>

                {/* 売上情報 */}
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    ¥{product.totalSales.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {product.totalQuantity}個・{percentage.toFixed(1)}%
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

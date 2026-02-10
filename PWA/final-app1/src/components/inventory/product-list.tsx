"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Package, Edit2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ProductGroup, ProductWithStock } from "@/types";
import { cn } from "@/lib/utils";

interface ProductListProps {
  products: ProductGroup[];
  onEditStock: (product: ProductWithStock) => void;
}

export function ProductList({ products, onEditStock }: ProductListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (code: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedGroups(newExpanded);
  };

  if (products.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">商品が見つかりません</h3>
            <p className="text-gray-500">検索条件を変更してお試しください</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: "text-red-500", bg: "bg-red-50", label: "在庫切れ" };
    if (stock < 3) return { color: "text-orange-500", bg: "bg-orange-50", label: "残りわずか" };
    return { color: "text-emerald-600", bg: "bg-emerald-50", label: "在庫あり" };
  };

  return (
    <div className="space-y-3">
      {products.map((group, index) => {
        const isExpanded = expandedGroups.has(group.商品コード);
        const hasVariants = group.variants.length > 1;
        const stockStatus = getStockStatus(group.totalStock);

        return (
          <Card 
            key={group.商品コード} 
            className={cn(
              "border-0 shadow-lg overflow-hidden transition-all duration-300 fade-in",
              isExpanded && "ring-2 ring-primary/20"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* グループヘッダー */}
            <div
              className={cn(
                "flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/80 transition-all",
                hasVariants && isExpanded && "bg-gradient-to-r from-gray-50 to-white border-b"
              )}
              onClick={() => hasVariants && toggleGroup(group.商品コード)}
            >
              <div className="flex items-center gap-4">
                {/* 商品画像サムネイル */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {group.variants[0].画像URL ? (
                    <Image
                      src={group.variants[0].画像URL}
                      alt={group.商品名}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 展開アイコン */}
                {hasVariants && (
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isExpanded ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  )}>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                )}

                {/* 商品情報 */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{group.商品名}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">{group.商品コード}</span>
                    {hasVariants && (
                      <span className="badge badge-primary">
                        {group.variants.length} サイズ
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">合計在庫</div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      stockStatus.color
                    )}>
                      {group.totalStock}
                    </span>
                    {group.totalStock === 0 ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : group.totalStock < 5 ? (
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                </div>
                {!hasVariants && (
                  <div className="flex items-center gap-2">
                    <Link href={`/inventory/${group.variants[0].商品ID}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl h-10 px-3 gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                        詳細
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-10 px-4 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStock(group.variants[0]);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                      編集
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* バリエーション一覧 */}
            {hasVariants && isExpanded && (
              <div className="bg-gradient-to-b from-gray-50/50 to-white divide-y divide-gray-100">
                {group.variants.map((variant, varIndex) => {
                  const variantStock = variant.stock?.在庫数 || 0;
                  const variantStatus = getStockStatus(variantStock);
                  
                  return (
                    <div
                      key={variant.商品ID}
                      className="flex items-center justify-between px-5 py-4 pl-16 hover:bg-gray-50/50 transition-colors fade-in"
                      style={{ animationDelay: `${varIndex * 30}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        {/* バリエーション画像 */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {variant.画像URL ? (
                            <Image
                              src={variant.画像URL}
                              alt={`${variant.商品名} ${variant.サイズ}`}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className={cn(
                              "w-full h-full flex items-center justify-center font-bold text-lg",
                              variantStatus.bg,
                              variantStatus.color
                            )}>
                              {variant.サイズ}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            サイズ {variant.サイズ}
                          </div>
                          <div className="text-sm text-gray-500">
                            JAN: {variant.JANコード}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ¥{variant.税込価格.toLocaleString()}
                          </div>
                          <div className={cn(
                            "text-sm font-semibold flex items-center gap-1 justify-end",
                            variantStatus.color
                          )}>
                            在庫: {variantStock}
                          </div>
                        </div>
                        <Link href={`/inventory/${variant.商品ID}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl h-9 px-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-9 px-3"
                          onClick={() => onEditStock(variant)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

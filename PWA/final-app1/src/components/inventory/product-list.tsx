"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Package, Edit2 } from "lucide-react";
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
      <div className="text-center py-12 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>商品が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((group) => {
        const isExpanded = expandedGroups.has(group.商品コード);
        const hasVariants = group.variants.length > 1;

        return (
          <Card key={group.商品コード} className="overflow-hidden">
            {/* グループヘッダー */}
            <div
              className={cn(
                "flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                hasVariants && "border-b"
              )}
              onClick={() => hasVariants && toggleGroup(group.商品コード)}
            >
              <div className="flex items-center gap-3">
                {hasVariants ? (
                  isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )
                ) : (
                  <div className="w-5" />
                )}
                <div>
                  <div className="font-medium">{group.商品名}</div>
                  <div className="text-sm text-gray-500">
                    {group.商品コード}
                    {hasVariants && (
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {group.variants.length} バリエーション
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">合計在庫</div>
                  <div
                    className={cn(
                      "font-bold",
                      group.totalStock === 0
                        ? "text-red-500"
                        : group.totalStock < 5
                        ? "text-orange-500"
                        : "text-green-600"
                    )}
                  >
                    {group.totalStock}
                  </div>
                </div>
                {!hasVariants && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStock(group.variants[0]);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* バリエーション一覧 */}
            {hasVariants && isExpanded && (
              <div className="bg-gray-50">
                {group.variants.map((variant) => (
                  <div
                    key={variant.商品ID}
                    className="flex items-center justify-between px-4 py-3 pl-12 border-b last:border-b-0 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm font-medium">
                          サイズ: {variant.サイズ}
                        </div>
                        <div className="text-xs text-gray-500">
                          JAN: {variant.JANコード}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          ¥{variant.税込価格.toLocaleString()}
                        </div>
                        <div
                          className={cn(
                            "font-medium",
                            (variant.stock?.在庫数 || 0) === 0
                              ? "text-red-500"
                              : (variant.stock?.在庫数 || 0) < 3
                              ? "text-orange-500"
                              : "text-green-600"
                          )}
                        >
                          在庫: {variant.stock?.在庫数 || 0}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditStock(variant)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Minus, Save } from "lucide-react";
import type { ProductWithStock } from "@/types";

interface StockEditModalProps {
  product: ProductWithStock;
  onClose: () => void;
  onSave: (productId: number, newQuantity: number) => Promise<void>;
}

export function StockEditModal({
  product,
  onClose,
  onSave,
}: StockEditModalProps) {
  const [quantity, setQuantity] = useState(product.stock?.在庫数 || 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(product.商品ID, quantity);
      onClose();
    } catch (error) {
      console.error("在庫更新エラー:", error);
      alert("在庫の更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const increment = () => setQuantity((q) => q + 1);
  const decrement = () => setQuantity((q) => Math.max(0, q - 1));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>在庫数を編集</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 商品情報 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium">{product.商品名}</div>
            <div className="text-sm text-gray-500 mt-1">
              サイズ: {product.サイズ} | JAN: {product.JANコード}
            </div>
            <div className="text-sm text-gray-500">
              価格: ¥{product.税込価格.toLocaleString()}（税込）
            </div>
          </div>

          {/* 在庫数入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              在庫数
            </label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={decrement}
                disabled={quantity <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="text-center text-xl font-bold w-24"
                min={0}
              />
              <Button variant="outline" size="icon" onClick={increment}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-500 mt-2 text-center">
              現在の在庫: {product.stock?.在庫数 || 0} →{" "}
              <span className="font-medium">{quantity}</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                "保存中..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

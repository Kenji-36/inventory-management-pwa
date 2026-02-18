"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Minus, Save } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
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
  const focusTrapRef = useFocusTrap(true);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="stock-edit-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Card className="w-full max-w-md bg-white shadow-2xl border-2 border-gray-300" ref={focusTrapRef}>
        <CardHeader className="flex flex-row items-center justify-between bg-gray-200 rounded-t-lg pb-4">
          <CardTitle id="stock-edit-title" className="text-gray-800 font-bold">在庫数を編集</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            aria-label="閉じる"
            className="text-gray-600 hover:bg-gray-300 rounded-full"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 bg-white p-6">
          {/* 商品情報 */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
            <div className="font-bold text-gray-700 text-lg">{product.商品名}</div>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">サイズ:</span>
                <span className="bg-white px-2 py-0.5 rounded border border-gray-300">{product.サイズ}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">JAN:</span>
                <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-gray-300">{product.JANコード}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">価格:</span>
                <span className="text-gray-700 font-bold">¥{product.税込価格.toLocaleString()}</span>
                <span className="text-xs text-gray-500">（税込）</span>
              </div>
            </div>
          </div>

          {/* 在庫数入力 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              在庫数
            </label>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={decrement}
                disabled={quantity <= 0}
                aria-label="在庫数を1つ減らす"
                className="h-12 w-12 rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <Minus className="w-5 h-5" aria-hidden="true" />
              </Button>
              <Input
                id="stock-quantity"
                name="quantity"
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="text-center text-3xl font-bold w-32 h-16 border-2 border-gray-300 rounded-xl shadow-inner"
                min={0}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={increment}
                aria-label="在庫数を1つ増やす"
                className="h-12 w-12 rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-100"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mt-4">
              <p className="text-sm text-gray-700 text-center font-medium">
                現在の在庫: <span className="font-bold">{product.stock?.在庫数 || 0}</span> 
                <span className="mx-2">→</span>
                <span className="font-bold text-gray-700 text-lg">{quantity}</span>
              </p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-100 font-semibold"
              onClick={onClose}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1 h-12 bg-gray-500 hover:bg-gray-600 text-white font-bold"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  保存中...
                </span>
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

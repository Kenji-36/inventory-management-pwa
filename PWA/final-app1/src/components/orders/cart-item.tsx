"use client";

import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, Package } from "lucide-react";
import Image from "next/image";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { product, quantity, subtotalInclTax } = item;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {product.画像URL ? (
            <Image
              src={product.画像URL}
              alt={product.商品名}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
        <div>
          <div className="font-medium">{product.商品名}</div>
          <div className="text-sm text-gray-500">
            サイズ: {product.サイズ} | ¥{product.税込価格.toLocaleString()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(product.商品ID, quantity - 1)}
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="w-10 text-center font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(product.商品ID, quantity + 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="w-24 text-right font-medium">
          ¥{subtotalInclTax.toLocaleString()}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onRemove(product.商品ID)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

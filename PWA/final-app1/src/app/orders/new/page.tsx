"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, ArrowLeft, ShoppingCart, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/hooks/useStore";
import { CartItem } from "@/components/orders/cart-item";
import { BarcodeScanner } from "@/components/inventory/barcode-scanner";
import type { Product } from "@/types";

export default function NewOrderPage() {
  const router = useRouter();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart } = useStore();
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{ orderId: number } | null>(null);

  // カート合計計算
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalExclTax = cart.reduce((sum, item) => sum + item.subtotalExclTax, 0);
  const totalInclTax = cart.reduce((sum, item) => sum + item.subtotalInclTax, 0);
  const tax = totalInclTax - totalExclTax;

  // バーコードスキャン結果
  const handleBarcodeScan = async (code: string) => {
    setShowScanner(false);

    try {
      const response = await fetch(`/api/products/${code}`);
      const data = await response.json();

      if (data.success && data.data) {
        const product: Product = data.data;
        addToCart(product);
      } else {
        alert(`JANコード ${code} の商品が見つかりません`);
      }
    } catch (err) {
      console.error("Scan error:", err);
      alert("エラーが発生しました");
    }
  };

  // 注文確定
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const items = cart.map((item) => ({
        productId: item.product.商品ID,
        quantity: item.quantity,
        unitPriceExclTax: item.product.税抜価格,
        unitPriceInclTax: item.product.税込価格,
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderComplete({ orderId: data.data.orderId });
        clearCart();
      } else {
        alert(data.error || "注文の作成に失敗しました");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 注文完了画面
  if (orderComplete) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">注文完了</h2>
              <p className="text-gray-600 mb-6">
                注文番号: #{orderComplete.orderId}
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => router.push("/orders")}
                >
                  注文一覧を見る
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setOrderComplete(null);
                  }}
                >
                  新しい注文を作成
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* ページヘッダー */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新規注文作成</h1>
            <p className="text-gray-600">バーコードスキャンで商品を追加</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 商品追加エリア */}
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>商品を追加</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  バーコードをスキャン
                </Button>
              </CardContent>
            </Card>

            {/* カート内商品 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  注文商品
                  {cart.length > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                      ({cart.length}種類)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>バーコードをスキャンして商品を追加してください</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <CartItem
                        key={item.product.商品ID}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 注文サマリー */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>注文サマリー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">商品点数</span>
                    <span>{totalQuantity}点</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">小計（税抜）</span>
                    <span>¥{totalExclTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">消費税</span>
                    <span>¥{tax.toLocaleString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>合計（税込）</span>
                    <span>¥{totalInclTax.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-6"
                  size="lg"
                  disabled={cart.length === 0 || isSubmitting}
                  onClick={handleSubmitOrder}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      処理中...
                    </>
                  ) : (
                    "注文を確定する"
                  )}
                </Button>

                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-2 text-red-500 hover:text-red-600"
                    onClick={clearCart}
                  >
                    カートを空にする
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* バーコードスキャナー */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </AppLayout>
  );
}

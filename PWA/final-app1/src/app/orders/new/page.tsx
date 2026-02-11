"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Camera, 
  ArrowLeft, 
  ShoppingCart, 
  CheckCircle, 
  Search,
  Plus,
  Package,
  ScanLine,
  List
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/hooks/useStore";
import { CartItem } from "@/components/orders/cart-item";
import { BarcodeScanner } from "@/components/inventory/barcode-scanner";
import type { Product, ProductGroup } from "@/types";

export default function NewOrderPage() {
  const router = useRouter();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart } = useStore();
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{ orderId: number } | null>(null);
  
  // 商品一覧関連
  const [products, setProducts] = useState<ProductGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [viewMode, setViewMode] = useState<"scan" | "list">("list");

  // カート合計計算
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalExclTax = cart.reduce((sum, item) => sum + item.subtotalExclTax, 0);
  const totalInclTax = cart.reduce((sum, item) => sum + item.subtotalInclTax, 0);
  const tax = totalInclTax - totalExclTax;

  // 商品一覧を取得
  const fetchProducts = useCallback(async (search?: string) => {
    setIsLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        grouped: "true",
        ...(search && { search }),
      });
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 検索実行（デバウンス）
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchProducts]);

  // 商品をカートに追加
  const handleAddProduct = (product: Product) => {
    addToCart(product);
  };

  // バーコードスキャン結果
  const handleBarcodeScan = async (code: string) => {
    setShowScanner(false);

    try {
      const response = await fetch(`/api/products?jancode=${code}`);
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
          <Card className="max-w-md mx-auto border-0 shadow-2xl">
            <CardContent className="pt-12 pb-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">注文完了</h2>
              <p className="text-gray-600 text-center mb-8">
                注文番号: <span className="font-semibold">#{orderComplete.orderId}</span>
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => router.push("/orders")}
                >
                  注文一覧を見る
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orders">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">新規注文作成</h1>
              <p className="text-gray-600">商品を選択してカートに追加</p>
            </div>
          </div>
          
          {/* 表示モード切替 */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`rounded-lg ${
                viewMode === "list"
                  ? "bg-white shadow-sm text-primary"
                  : "text-gray-600"
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              一覧から選択
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("scan")}
              className={`rounded-lg ${
                viewMode === "scan"
                  ? "bg-white shadow-sm text-primary"
                  : "text-gray-600"
              }`}
            >
              <ScanLine className="w-4 h-4 mr-2" />
              スキャン
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 商品選択エリア */}
          <div className="lg:col-span-2 space-y-6">
            {viewMode === "scan" ? (
              /* スキャンモード */
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="bg-gray-50 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2">
                    <ScanLine className="w-5 h-5 text-gray-700" />
                    バーコードスキャン
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center mx-auto mb-6">
                      <Camera className="w-10 h-10 text-gray-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      バーコードをスキャン
                    </h3>
                    <p className="text-gray-500 mb-6">
                      商品のバーコードを読み取って追加
                    </p>
                    <Button
                      className="w-full max-w-sm bg-gray-700 hover:bg-gray-800 text-white font-bold shadow-md"
                      size="lg"
                      onClick={() => setShowScanner(true)}
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      スキャンを開始
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* 一覧モード */
              <>
                {/* 検索バー */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        placeholder="商品名、商品コード、JANコードで検索..."
                        className="pl-12 h-12 text-base bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 商品一覧 */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-gray-700" />
                      商品一覧
                      {products.length > 0 && (
                        <span className="text-sm font-normal text-gray-500">
                          ({products.length}グループ)
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoadingProducts ? (
                      <div className="p-8 space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-20 bg-gray-100 rounded-xl shimmer" />
                        ))}
                      </div>
                    ) : products.length === 0 ? (
                      <div className="py-12 text-center">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">商品が見つかりません</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {products.map((group) =>
                          group.variants.map((variant) => {
                            const inCart = cart.find(
                              (item) => item.product.商品ID === variant.商品ID
                            );
                            const stockQuantity = variant.stock?.在庫数 || 0;
                            const isOutOfStock = stockQuantity === 0;
                            
                            return (
                              <div
                                key={variant.商品ID}
                                className="p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {/* 商品画像 */}
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                      {variant.画像URL ? (
                                        <Image
                                          src={variant.画像URL}
                                          alt={`${variant.商品名} ${variant.サイズ}`}
                                          fill
                                          className="object-cover"
                                          sizes="64px"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                          <Package className="w-6 h-6 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-gray-900 truncate text-base">
                                        {variant.商品名}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1 flex-wrap">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
                                          {variant.サイズ}
                                        </span>
                                        <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                                          {variant.商品コード}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1 flex-wrap">
                                        <span className="font-mono text-xs text-gray-700">
                                          JAN: {variant.JANコード}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900">
                                          ¥{variant.税込価格.toLocaleString()}
                                        </span>
                                        <span className={`text-xs font-semibold ${
                                          isOutOfStock ? "text-red-500" : 
                                          stockQuantity < 3 ? "text-orange-500" : 
                                          "text-emerald-600"
                                        }`}>
                                          在庫: {stockQuantity}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* 数量調整ボタン */}
                                  {inCart ? (
                                    <div className="flex items-center gap-2 flex-shrink-0 bg-gray-50 rounded-xl p-1 border-2 border-gray-200">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          if (inCart.quantity > 1) {
                                            updateQuantity(variant.商品ID, inCart.quantity - 1);
                                          } else {
                                            removeFromCart(variant.商品ID);
                                          }
                                        }}
                                        className="w-9 h-9 p-0 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-500 hover:text-white text-gray-600 font-bold transition-colors"
                                      >
                                        <span className="text-xl">−</span>
                                      </Button>
                                      <span className="w-10 text-center font-bold text-gray-700 text-lg bg-white rounded-md py-1 border border-gray-300">
                                        {inCart.quantity}
                                      </span>
                                      <Button
                                        size="sm"
                                        onClick={() => updateQuantity(variant.商品ID, inCart.quantity + 1)}
                                        disabled={inCart.quantity >= stockQuantity}
                                        className="w-9 h-9 p-0 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-500 hover:text-white text-gray-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <span className="text-xl">+</span>
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddProduct(variant)}
                                      disabled={isOutOfStock}
                                      className="rounded-xl flex-shrink-0 gap-1 h-10 px-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold border border-gray-500"
                                    >
                                      <Plus className="w-4 h-4" />
                                      追加
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* カート内商品 */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                  注文商品
                  {cart.length > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                      ({cart.length}種類)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>商品を追加してください</p>
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
            <Card className="sticky top-6 border-2 border-gray-300 shadow-lg">
              <CardHeader className="bg-gray-200">
                <CardTitle className="text-gray-800 font-bold text-xl">注文サマリー</CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-white">
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600 py-2">
                    <span className="font-medium">商品点数</span>
                    <span className="font-bold text-gray-700 text-lg">{totalQuantity}点</span>
                  </div>
                  <div className="flex justify-between text-gray-600 py-2">
                    <span className="font-medium">小計（税抜）</span>
                    <span className="font-bold text-gray-700 text-lg">
                      ¥{totalExclTax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 py-2">
                    <span className="font-medium">消費税</span>
                    <span className="font-bold text-gray-700 text-lg">
                      ¥{tax.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-0.5 bg-gray-300 my-4" />
                  <div className="flex justify-between bg-gray-100 p-4 rounded-xl border-2 border-gray-300">
                    <span className="text-xl font-bold text-gray-700">合計（税込）</span>
                    <span className="text-2xl font-bold text-gray-700">¥{totalInclTax.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-6 h-14 text-lg font-bold bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200"
                  size="lg"
                  disabled={cart.length === 0 || isSubmitting}
                  onClick={handleSubmitOrder}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full" />
                      処理中...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      注文を確定する
                    </span>
                  )}
                </Button>

                {cart.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full mt-3 h-12 text-base font-semibold text-gray-600 hover:text-gray-700 border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
                    onClick={clearCart}
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      カートを空にする
                    </span>
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

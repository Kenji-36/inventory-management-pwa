"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Package, 
  Save, 
  Loader2,
  Image as ImageIcon,
  Barcode,
  Tag,
  DollarSign,
  Ruler,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/products/image-upload";
import type { ProductWithStock } from "@/types";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const productId = parseInt(id);
  
  const [product, setProduct] = useState<ProductWithStock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 商品データを取得
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products?id=${productId}`);
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          setProduct(data.data[0]);
        } else {
          setError("商品が見つかりません");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isNaN(productId)) {
      fetchProduct();
    } else {
      setError("無効な商品IDです");
      setIsLoading(false);
    }
  }, [productId]);

  // 在庫数量を更新
  const handleUpdateStock = async (newQuantity: number) => {
    if (!product) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/stock", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.商品ID,
          quantity: newQuantity,
          mode: "set",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProduct({
          ...product,
          stock: {
            ...product.stock!,
            在庫数: newQuantity,
          },
        });
        alert("在庫数を更新しました");
      } else {
        alert(data.error || "更新に失敗しました");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  // 画像アップロード成功時
  const handleImageUploadSuccess = (imageUrl: string) => {
    if (product) {
      setProduct({
        ...product,
        画像URL: imageUrl,
      });
    }
  };

  // 画像削除成功時
  const handleImageDeleteSuccess = () => {
    if (product) {
      setProduct({
        ...product,
        画像URL: null,
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div className="h-12 w-48 bg-gray-200 rounded-lg shimmer" />
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-96 bg-white rounded-2xl shimmer" />
              <div className="h-96 bg-white rounded-2xl shimmer" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !product) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto border-0 shadow-lg">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                  <Package className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">エラー</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <Link href="/inventory">
                  <Button>在庫一覧に戻る</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* ページヘッダー */}
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">商品詳細</h1>
            <p className="text-gray-600">商品情報と在庫管理</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左側: 商品画像 */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  商品画像
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ImageUpload
                  productId={product.商品ID}
                  currentImageUrl={product.画像URL}
                  onUploadSuccess={handleImageUploadSuccess}
                  onDeleteSuccess={handleImageDeleteSuccess}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右側: 商品情報 */}
          <div className="space-y-6">
            {/* 基本情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    商品名
                  </label>
                  <Input
                    value={product.商品名}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      サイズ
                    </label>
                    <Input
                      value={product.サイズ}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      商品コード
                    </label>
                    <Input
                      value={product.商品コード}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Barcode className="w-4 h-4" />
                    JANコード
                  </label>
                  <Input
                    value={product.JANコード}
                    readOnly
                    className="bg-gray-50 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      税抜価格
                    </label>
                    <Input
                      value={`¥${product.税抜価格.toLocaleString()}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      税込価格
                    </label>
                    <Input
                      value={`¥${product.税込価格.toLocaleString()}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 在庫情報 */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  在庫情報
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    在庫数量
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={product.stock?.在庫数 || 0}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        if (product.stock) {
                          setProduct({
                            ...product,
                            stock: {
                              ...product.stock,
                              在庫数: newQuantity,
                            },
                          });
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleUpdateStock(product.stock?.在庫数 || 0)}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          保存
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {product.stock?.最終入庫日 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      最終入庫日
                    </label>
                    <Input
                      value={new Date(product.stock.最終入庫日).toLocaleDateString('ja-JP')}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                )}

                {/* 在庫ステータス */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">在庫ステータス</span>
                    <span className={`badge ${
                      (product.stock?.在庫数 || 0) === 0 ? 'badge-danger' :
                      (product.stock?.在庫数 || 0) < 3 ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {(product.stock?.在庫数 || 0) === 0 ? '在庫切れ' :
                       (product.stock?.在庫数 || 0) < 3 ? '在庫少' :
                       '在庫あり'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

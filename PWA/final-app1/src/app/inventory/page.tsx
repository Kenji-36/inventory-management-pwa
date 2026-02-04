"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Camera, Download, Upload, RefreshCw, Package } from "lucide-react";
import { ProductList } from "@/components/inventory/product-list";
import { StockEditModal } from "@/components/inventory/stock-edit-modal";
import { BarcodeScanner } from "@/components/inventory/barcode-scanner";
import { CsvUploadModal } from "@/components/inventory/csv-upload-modal";
import type { ProductGroup, ProductWithStock } from "@/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  // 商品データを取得
  const fetchProducts = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        grouped: "true",
        ...(search && { search }),
      });
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.error || "データの取得に失敗しました");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("サーバーに接続できません");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回読み込み
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

  // 在庫更新
  const handleUpdateStock = async (productId: number, newQuantity: number) => {
    const response = await fetch("/api/stock", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: newQuantity,
        mode: "set",
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "更新に失敗しました");
    }

    // データを再取得
    await fetchProducts(searchTerm);
  };

  // バーコードスキャン結果
  const handleBarcodeScan = async (code: string) => {
    setShowScanner(false);
    
    try {
      // JANコードで商品を検索
      const response = await fetch(`/api/products/${code}`);
      const data = await response.json();

      if (data.success && data.data) {
        // 在庫を+1する
        await fetch("/api/stock", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: data.data.商品ID,
            quantity: 1,
            mode: "add",
          }),
        });

        alert(`${data.data.商品名}（${data.data.サイズ}）の在庫を追加しました`);
        await fetchProducts(searchTerm);
      } else {
        alert(`JANコード ${code} の商品が見つかりません`);
      }
    } catch (err) {
      console.error("Scan error:", err);
      alert("エラーが発生しました");
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* ページヘッダー */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">在庫管理</h1>
            <p className="text-gray-600">商品の在庫状況を確認・管理します</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProducts(searchTerm)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            更新
          </Button>
        </div>

        {/* 検索・アクションバー */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 検索 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="商品名、商品コード、JANコードで検索..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* アクションボタン */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  title="バーコードスキャン（在庫追加）"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = "/api/csv/download?type=data";
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV出力
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCsvUpload(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  CSV入力
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 商品一覧 */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                <p className="text-gray-500 mt-4">読み込み中...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-red-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{error}</p>
                <p className="text-sm mt-2 text-gray-500">
                  Google Spreadsheet の設定を確認してください
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fetchProducts()}
                >
                  再試行
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              {products.length} 件の商品グループ
            </div>
            <ProductList
              products={products}
              onEditStock={setEditingProduct}
            />
          </>
        )}
      </div>

      {/* 在庫編集モーダル */}
      {editingProduct && (
        <StockEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleUpdateStock}
        />
      )}

      {/* バーコードスキャナー */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* CSVアップロードモーダル */}
      {showCsvUpload && (
        <CsvUploadModal
          onClose={() => setShowCsvUpload(false)}
          onSuccess={() => fetchProducts(searchTerm)}
        />
      )}
    </AppLayout>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRealtimeStock } from "@/hooks/useRealtimeStock";
import { useToast } from "@/components/ui/toast";
import { 
  Search, 
  Camera, 
  Download, 
  Upload, 
  RefreshCw, 
  Package,
  Boxes,
  ScanLine,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
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
  const { info } = useToast();

  // リアルタイム在庫更新
  const { isConnected } = useRealtimeStock(
    useCallback((update) => {
      console.log('Stock updated:', update);
      info("在庫が更新されました", `商品ID: ${update.product_id} の在庫が ${update.quantity} に変更されました`);
      // データを再取得
      fetchProducts(searchTerm);
    }, [searchTerm])
  );

  // 商品データを取得
  const fetchProducts = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        grouped: "true",
        ...(search && { search }),
      });
      const response = await fetch(`/api/products?${params}`, {
        credentials: 'include',
      });
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
      credentials: "include",
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

    await fetchProducts(searchTerm);
  };

  // バーコードスキャン結果
  const handleBarcodeScan = async (code: string) => {
    setShowScanner(false);
    
    try {
      const response = await fetch(`/api/products?jancode=${code}`);
      const data = await response.json();

      if (data.success && data.data) {
        await fetch("/api/stock", {
          method: "PUT",
          credentials: "include",
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

  // 統計情報を計算
  const stats = {
    totalProducts: products.reduce((sum, g) => sum + g.variants.length, 0),
    totalGroups: products.length,
    totalStock: products.reduce((sum, g) => 
      sum + g.variants.reduce((s, v) => s + (v.stock?.在庫数 || 0), 0), 0
    ),
    lowStock: products.reduce((sum, g) =>
      sum + g.variants.filter(v => (v.stock?.在庫数 || 0) < 3).length, 0
    ),
  };

  return (
    <AppLayout>
      {/* Hero Section - Sticky */}
      <div className="sticky top-0 z-40 bg-gray-50 container mx-auto px-4 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-xl bg-gray-100 px-6 py-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Boxes className="w-5 h-5 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-800">在庫管理</h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500">商品グループ</span>
                  <span className="ml-2 font-semibold text-gray-800">{stats.totalGroups}</span>
                </div>
                <div>
                  <span className="text-gray-500">総SKU数</span>
                  <span className="ml-2 font-semibold text-gray-800">{stats.totalProducts}</span>
                </div>
                <div>
                  <span className="text-gray-500">総在庫数</span>
                  <span className="ml-2 font-semibold text-gray-800">{stats.totalStock.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">在庫アラート</span>
                  <span className="ml-2 font-semibold text-gray-800 flex items-center gap-1">
                    {stats.lowStock}
                    {stats.lowStock > 0 && <AlertCircle className="w-4 h-4 text-gray-500" />}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                    <span>リアルタイム</span>
                  </div>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchProducts(searchTerm)}
                  disabled={isLoading}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 h-8"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                  更新
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="container mx-auto px-4 space-y-6 pb-8">
        {/* Search & Action Bar */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* 検索 */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="inventory-search"
                  name="search"
                  type="search"
                  placeholder="商品名、商品コード、JANコードで検索..."
                  className="pl-12 h-12 text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* アクションボタン */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowScanner(true)}
                  className="h-12 px-5 bg-gray-500 hover:bg-gray-600 text-white border-0 rounded-xl gap-2"
                >
                  <ScanLine className="w-5 h-5" />
                  <span className="hidden sm:inline">スキャン入庫</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/api/csv/download?type=data"}
                  className="h-12 px-4 rounded-xl gap-2 border-gray-300 hover:bg-gray-50"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">CSV出力</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCsvUpload(true)}
                  className="h-12 px-4 rounded-xl gap-2 border-gray-300 hover:bg-gray-50"
                >
                  <Upload className="w-5 h-5" />
                  <span className="hidden sm:inline">CSV入力</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 商品一覧 */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl shimmer" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                  <Package className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
                <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                <Button onClick={() => fetchProducts()} size="lg" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  再試行
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{products.length}</span> 件の商品グループ
              </p>
            </div>
            <ProductList
              products={products}
              onEditStock={setEditingProduct}
            />
          </>
        )}
      </div>

      {/* Modals */}
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

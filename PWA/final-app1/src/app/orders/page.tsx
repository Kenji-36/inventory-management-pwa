"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { OrderList } from "@/components/orders/order-list";
import { OrderDetailModal } from "@/components/orders/order-detail-modal";
import type { Order } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 注文データを取得
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
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
    fetchOrders();
  }, [fetchOrders]);

  // 統計情報
  const stats = {
    totalOrders: orders.length,
    todayOrders: orders.filter((o) => {
      const today = new Date().toISOString().split("T")[0];
      return o.注文日.startsWith(today);
    }).length,
    totalSales: orders.reduce((sum, o) => sum + o["注文金額(税込)"], 0),
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* ページヘッダー */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">注文管理</h1>
            <p className="text-gray-600">注文履歴の確認と新規注文の作成</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              更新
            </Button>
            <Link href="/orders/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新規注文
              </Button>
            </Link>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">総注文数</div>
              <div className="text-2xl font-bold">{stats.totalOrders}件</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">本日の注文</div>
              <div className="text-2xl font-bold">{stats.todayOrders}件</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">総売上（税込）</div>
              <div className="text-2xl font-bold">
                ¥{stats.totalSales.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 注文一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>注文一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                <p className="text-gray-500 mt-4">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
                <p className="text-red-500">{error}</p>
                <p className="text-sm mt-2 text-gray-500">
                  Google Spreadsheet の設定を確認してください
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={fetchOrders}
                >
                  再試行
                </Button>
              </div>
            ) : (
              <OrderList orders={orders} onSelectOrder={setSelectedOrder} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 注文詳細モーダル */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </AppLayout>
  );
}

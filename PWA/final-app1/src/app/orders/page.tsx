"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  RefreshCw, 
  ShoppingCart, 
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  ArrowUpRight
} from "lucide-react";
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
      const response = await fetch("/api/orders", {
        credentials: 'include',
      });
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
    avgOrderValue: orders.length > 0 
      ? Math.round(orders.reduce((sum, o) => sum + o["注文金額(税込)"], 0) / orders.length)
      : 0,
  };

  return (
    <AppLayout>
      {/* Hero Section - Sticky */}
      <div className="sticky top-0 z-40 bg-gray-50 container mx-auto px-4 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-xl bg-gray-100 px-6 py-4 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <h1 className="text-xl font-bold text-gray-800">注文管理</h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500">総注文数</span>
                  <span className="ml-2 font-semibold text-gray-800">{stats.totalOrders}件</span>
                </div>
                <div>
                  <span className="text-gray-500">本日の注文</span>
                  <span className="ml-2 font-semibold text-gray-800">{stats.todayOrders}件</span>
                </div>
                <div>
                  <span className="text-gray-500">総売上</span>
                  <span className="ml-2 font-semibold text-gray-800">¥{(stats.totalSales / 1000).toFixed(0)}k</span>
                </div>
                <div>
                  <span className="text-gray-500">平均注文額</span>
                  <span className="ml-2 font-semibold text-gray-800">¥{stats.avgOrderValue.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchOrders}
                  disabled={isLoading}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 h-8"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                  更新
                </Button>
                <Link href="/orders/new">
                  <Button size="sm" className="bg-gray-500 text-white hover:bg-gray-600 border-0 h-8">
                    <Plus className="w-3 h-3 mr-1" />
                    新規注文
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="container mx-auto px-4 space-y-6 pb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-gray-200 shadow-sm card-hover overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-400 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">総注文数</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.totalOrders}件</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm card-hover overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-400 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">本日の注文</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.todayOrders}件</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm card-hover overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-400 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">総売上（税込）</p>
                  <p className="text-2xl font-bold text-gray-700">
                    ¥{stats.totalSales.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm card-hover overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-400 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">平均注文額</p>
                  <p className="text-2xl font-bold text-gray-700">
                    ¥{stats.avgOrderValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action */}
        <Link href="/orders/new">
          <Card className="border border-gray-200 shadow-sm card-hover bg-white hover:bg-gray-50 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-400 flex items-center justify-center">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 text-lg">新規注文を作成</h3>
                    <p className="text-gray-500">バーコードスキャンで商品を追加して注文を作成</p>
                  </div>
                </div>
                <ArrowUpRight className="w-6 h-6 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 注文一覧 */}
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-gray-600" />
              注文一覧
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl shimmer" />
                ))}
              </div>
            ) : error ? (
              <div className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                    <ShoppingCart className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
                  <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                  <Button onClick={fetchOrders} size="lg" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    再試行
                  </Button>
                </div>
              </div>
            ) : (
              <OrderList orders={orders} onSelectOrder={setSelectedOrder} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
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

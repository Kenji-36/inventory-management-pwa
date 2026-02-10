"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Boxes,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SalesChart } from "./sales-chart";
import { ProductRanking } from "./product-ranking";
import { StockAlerts } from "./stock-alerts";

interface DashboardData {
  summary: {
    totalProducts: number;
    totalSKUs: number;
    outOfStock: number;
    lowStock: number;
    todayOrders: number;
    weekOrders: number;
    monthOrders: number;
    todaySales: number;
    weekSales: number;
    monthSales: number;
  };
  salesTrend: {
    date: string;
    totalOrders: number;
    totalSalesExclTax: number;
    totalSalesInclTax: number;
  }[];
  topProducts: {
    productId: number;
    productName: string;
    productCode: string;
    size: string;
    totalQuantity: number;
    totalSales: number;
  }[];
  stockAlerts: {
    productId: number;
    productName: string;
    size: string;
    stock: number;
  }[];
}

interface DashboardContentProps {
  userName: string;
}

export function DashboardContent({ userName: initialName }: DashboardContentProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState(initialName);

  // Supabase からユーザー名を取得
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.name || user.email || initialName);
      }
    });
  }, [initialName]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "データの取得に失敗しました");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("サーバーに接続できません");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded-lg shimmer" />
            <div className="h-4 w-48 bg-gray-200 rounded shimmer" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl shimmer" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">接続エラー</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          {error}<br />
          Google Spreadsheet の設定を確認してください
        </p>
        <Button onClick={fetchData} size="lg" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          再試行
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, salesTrend, topProducts, stockAlerts } = data;
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "おはようございます" : currentHour < 18 ? "こんにちは" : "こんばんは";

  const heroSection = (
    <div className="sticky top-0 z-40 bg-gray-50 container mx-auto px-4 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-xl bg-blue-600 px-6 py-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <h1 className="text-xl font-bold">{userName}さん - ダッシュボード</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-white/70">今日の売上</span>
                <span className="ml-2 font-semibold">¥{summary.todaySales.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-white/70">今日の注文</span>
                <span className="ml-2 font-semibold">{summary.todayOrders}件</span>
              </div>
              <div>
                <span className="text-white/70">在庫アラート</span>
                <span className="ml-2 font-semibold">{summary.outOfStock + summary.lowStock}件</span>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchData}
              className="bg-white/20 hover:bg-white/30 text-white border-0 h-8"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              更新
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {heroSection}
      <div className="container mx-auto px-4 space-y-8 pb-8">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-hover border-0 shadow-lg shadow-blue-500/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">総商品数</p>
                <p className="text-3xl font-bold text-gray-900">{summary.totalProducts}</p>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="badge badge-primary">{summary.totalSKUs} SKU</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-lg shadow-green-500/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">今月の注文</p>
                <p className="text-3xl font-bold text-gray-900">{summary.monthOrders}件</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">今週 {summary.weekOrders}件</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl gradient-success flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover border-0 shadow-lg shadow-purple-500/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">今月の売上</p>
                <p className="text-3xl font-bold text-gray-900">¥{(summary.monthSales / 1000).toFixed(0)}k</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-600 font-medium">
                    今週 ¥{summary.weekSales.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`card-hover border-0 shadow-lg overflow-hidden ${
          summary.outOfStock > 0 ? "shadow-red-500/10" : "shadow-orange-500/5"
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">在庫アラート</p>
                <p className="text-3xl font-bold text-gray-900">
                  {summary.outOfStock + summary.lowStock}件
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {summary.outOfStock > 0 && (
                    <span className="badge badge-danger">在庫切れ {summary.outOfStock}</span>
                  )}
                  {summary.lowStock > 0 && (
                    <span className="badge badge-warning">残少 {summary.lowStock}</span>
                  )}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                summary.outOfStock > 0 ? "gradient-danger" : "gradient-warning"
              }`}>
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <SalesChart data={salesTrend} />

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductRanking products={topProducts} />
        <StockAlerts alerts={stockAlerts} />
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            クイックアクション
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/orders/new"
              className="group flex items-center p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">新規注文を作成</div>
                <div className="text-sm text-gray-500">
                  バーコードスキャンで商品を追加
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </Link>
            <Link
              href="/inventory"
              className="group flex items-center p-5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl gradient-success flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Boxes className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">在庫を確認</div>
                <div className="text-sm text-gray-500">
                  商品一覧と在庫状況をチェック
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}

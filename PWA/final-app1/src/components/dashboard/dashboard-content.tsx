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
} from "lucide-react";
import Link from "next/link";
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

export function DashboardContent({ userName }: DashboardContentProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard");
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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-gray-500 mt-4">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-500 mb-2">{error}</p>
        <p className="text-sm text-gray-500 mb-4">
          Google Spreadsheet の設定を確認してください
        </p>
        <Button onClick={fetchData}>再試行</Button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, salesTrend, topProducts, stockAlerts } = data;

  return (
    <>
      {/* ウェルカムメッセージ */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ようこそ、{userName}さん
          </h1>
          <p className="text-gray-600">在庫注文管理システムのダッシュボードです</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          更新
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              総商品数
            </CardTitle>
            <Package className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
            <p className="text-xs text-gray-500">{summary.totalSKUs} SKU</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              本日の注文
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.todayOrders}件</div>
            <p className="text-xs text-gray-500">
              今週 {summary.weekOrders}件 / 今月 {summary.monthOrders}件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              今月の売上
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{summary.monthSales.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">
              本日 ¥{summary.todaySales.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              在庫アラート
            </CardTitle>
            <AlertTriangle
              className={`h-5 w-5 ${
                summary.outOfStock > 0 ? "text-red-500" : "text-orange-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.outOfStock + summary.lowStock}件
            </div>
            <p className="text-xs text-gray-500">
              在庫切れ {summary.outOfStock} / 在庫少 {summary.lowStock}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 売上推移グラフ */}
      <div className="mb-8">
        <SalesChart data={salesTrend} />
      </div>

      {/* 下段：ランキングとアラート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProductRanking products={topProducts} />
        <StockAlerts alerts={stockAlerts} />
      </div>

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="/orders/new"
              className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 mr-3 text-primary" />
              <div>
                <div className="font-medium">新規注文を作成</div>
                <div className="text-sm text-gray-500">
                  バーコードスキャンで商品を追加
                </div>
              </div>
            </Link>
            <Link
              href="/inventory"
              className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Package className="h-5 w-5 mr-3 text-primary" />
              <div>
                <div className="font-medium">在庫を確認</div>
                <div className="text-sm text-gray-500">商品一覧と在庫状況</div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface StockAlert {
  productId: number;
  productName: string;
  size: string;
  stock: number;
}

interface StockAlertsProps {
  alerts: StockAlert[];
}

export function StockAlerts({ alerts }: StockAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            在庫アラート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-green-600">
            <CheckCircle className="w-12 h-12 mx-auto mb-4" />
            <p className="font-medium">在庫状況は良好です</p>
            <p className="text-sm text-gray-500 mt-1">
              在庫切れ・在庫少の商品はありません
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          在庫アラート
          <span className="text-sm font-normal text-gray-500">
            ({alerts.length}件)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.productId}
              className={`flex items-center justify-between p-3 rounded-lg ${
                alert.stock === 0
                  ? "bg-red-50 border border-red-200"
                  : "bg-orange-50 border border-orange-200"
              }`}
            >
              <div>
                <div className="font-medium">{alert.productName}</div>
                <div className="text-sm text-gray-500">サイズ: {alert.size}</div>
              </div>
              <div
                className={`font-bold ${
                  alert.stock === 0 ? "text-red-600" : "text-orange-600"
                }`}
              >
                {alert.stock === 0 ? "在庫切れ" : `残り ${alert.stock}個`}
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/inventory"
          className="block text-center text-sm text-primary hover:underline mt-4"
        >
          在庫管理画面へ →
        </Link>
      </CardContent>
    </Card>
  );
}

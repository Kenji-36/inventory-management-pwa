"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ArrowRight, AlertCircle, Package } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const outOfStock = alerts.filter(a => a.stock === 0).length;
  const lowStock = alerts.filter(a => a.stock > 0).length;

  if (alerts.length === 0) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            在庫アラート
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">在庫状況は良好です</h3>
            <p className="text-sm text-gray-500">
              在庫切れ・在庫少の商品はありません
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              outOfStock > 0 
                ? "bg-gradient-to-br from-red-400 to-rose-500" 
                : "bg-gradient-to-br from-orange-400 to-amber-500"
            )}>
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            在庫アラート
          </CardTitle>
          <div className="flex gap-2">
            {outOfStock > 0 && (
              <span className="badge badge-danger">{outOfStock} 在庫切れ</span>
            )}
            {lowStock > 0 && (
              <span className="badge badge-warning">{lowStock} 残少</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {alerts.map((alert, index) => (
            <div
              key={alert.productId}
              className={cn(
                "flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors fade-in",
                alert.stock === 0 
                  ? "bg-gradient-to-r from-red-50/50 to-transparent" 
                  : "bg-gradient-to-r from-orange-50/30 to-transparent"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                alert.stock === 0 
                  ? "bg-red-100 text-red-600" 
                  : "bg-orange-100 text-orange-600"
              )}>
                {alert.stock === 0 ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Package className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{alert.productName}</div>
                <div className="text-sm text-gray-500">サイズ: {alert.size}</div>
              </div>
              <div
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold text-sm",
                  alert.stock === 0 
                    ? "bg-red-100 text-red-700" 
                    : "bg-orange-100 text-orange-700"
                )}
              >
                {alert.stock === 0 ? "在庫切れ" : `残り ${alert.stock}個`}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50/50">
          <Link
            href="/inventory"
            className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            在庫管理画面で確認
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

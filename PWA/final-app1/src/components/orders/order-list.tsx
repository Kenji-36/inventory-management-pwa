"use client";

import { Button } from "@/components/ui/button";
import { FileText, ChevronRight, ShoppingCart, Calendar, Clock, Package } from "lucide-react";
import type { Order } from "@/types";
import { cn } from "@/lib/utils";

interface OrderListProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export function OrderList({ orders, onSelectOrder }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
            <ShoppingCart className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">注文データがありません</h3>
          <p className="text-gray-500">新しい注文を作成してください</p>
        </div>
      </div>
    );
  }

  // 日付でグループ化
  const groupedOrders = orders.reduce((groups, order) => {
    const date = order.注文日.includes('T')
      ? order.注文日.split('T')[0]
      : order.注文日.split(' ')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(order);
    return groups;
  }, {} as Record<string, Order[]>);

  // 日付をフォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr.replace(/\//g, "-"));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split("T")[0]) {
      return "今日";
    }
    if (dateStr === yesterday.toISOString().split("T")[0]) {
      return "昨日";
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
    return `${month}月${day}日（${weekday}）`;
  };

  return (
    <div className="divide-y divide-gray-100">
      {Object.entries(groupedOrders).map(([date, dateOrders], groupIndex) => (
        <div key={date} className="fade-in" style={{ animationDelay: `${groupIndex * 50}ms` }}>
          {/* 日付ヘッダー */}
          <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-white px-6 py-3 flex items-center gap-2 border-b border-gray-100">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">{formatDate(date)}</span>
            <span className="text-xs text-gray-400">({dateOrders.length}件)</span>
          </div>
          
          {/* 注文一覧 */}
          <div className="divide-y divide-gray-50">
            {dateOrders.map((order, index) => (
              <div
                key={order.注文ID}
                className="group px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 cursor-pointer transition-all duration-200 fade-in"
                style={{ animationDelay: `${(groupIndex * 50) + (index * 30)}ms` }}
                onClick={() => onSelectOrder(order)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        注文 #{order.注文ID}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {order.商品数}点
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {(() => {
                            const d = new Date(order.注文日);
                            return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ¥{order["注文金額(税込)"].toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        税抜 ¥{order["注文金額(税抜)"].toLocaleString()}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 group-hover:text-gray-700 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

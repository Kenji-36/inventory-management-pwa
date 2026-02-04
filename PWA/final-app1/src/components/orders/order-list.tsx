"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight, ShoppingCart } from "lucide-react";
import type { Order } from "@/types";

interface OrderListProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export function OrderList({ orders, onSelectOrder }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>注文データがありません</p>
      </div>
    );
  }

  // 日付でグループ化
  const groupedOrders = orders.reduce((groups, order) => {
    const date = order.注文日.split(" ")[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(order);
    return groups;
  }, {} as Record<string, Order[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedOrders).map(([date, dateOrders]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
          <div className="space-y-2">
            {dateOrders.map((order) => (
              <Card
                key={order.注文ID}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelectOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          注文 #{order.注文ID}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.商品数}点 |{" "}
                          {order.注文日.split(" ")[1] || order.注文日}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">
                          ¥{order["注文金額(税込)"].toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          (税抜 ¥{order["注文金額(税抜)"].toLocaleString()})
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

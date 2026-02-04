"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

interface SalesData {
  date: string;
  totalOrders: number;
  totalSalesExclTax: number;
  totalSalesInclTax: number;
}

interface SalesChartProps {
  data: SalesData[];
}

type ChartType = "line" | "bar";
type Period = "7" | "14" | "30";

export function SalesChart({ data }: SalesChartProps) {
  const [chartType, setChartType] = useState<ChartType>("line");
  const [period, setPeriod] = useState<Period>("7");

  // 期間でフィルタリング
  const filteredData = data.slice(-Number(period));

  // 日付を短い形式に変換
  const formattedData = filteredData.map((d) => ({
    ...d,
    displayDate: d.date.slice(5).replace("-", "/"), // "2024-01-15" -> "01/15"
  }));

  // 合計計算
  const totalSales = filteredData.reduce((sum, d) => sum + d.totalSalesInclTax, 0);
  const totalOrders = filteredData.reduce((sum, d) => sum + d.totalOrders, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            売上推移
          </CardTitle>
          <div className="flex gap-2">
            {/* 期間選択 */}
            <div className="flex gap-1">
              {(["7", "14", "30"] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                >
                  {p}日
                </Button>
              ))}
            </div>
            {/* チャートタイプ選択 */}
            <div className="flex gap-1">
              <Button
                variant={chartType === "line" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("line")}
              >
                線
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("bar")}
              >
                棒
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* サマリー */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">期間売上（税込）</div>
            <div className="text-xl font-bold">
              ¥{totalSales.toLocaleString()}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">期間注文数</div>
            <div className="text-xl font-bold">{totalOrders}件</div>
          </div>
        </div>

        {/* グラフ */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${value / 1000}k` : String(value)
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    `¥${Number(value).toLocaleString()}`,
                    "売上",
                  ]}
                  labelFormatter={(label) => `日付: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="totalSalesInclTax"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${value / 1000}k` : String(value)
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    `¥${Number(value).toLocaleString()}`,
                    "売上",
                  ]}
                  labelFormatter={(label) => `日付: ${label}`}
                />
                <Bar dataKey="totalSalesInclTax" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

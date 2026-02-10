"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
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
import { TrendingUp, BarChart3, LineChart } from "lucide-react";

interface SalesData {
  date: string;
  totalOrders: number;
  totalSalesExclTax: number;
  totalSalesInclTax: number;
}

interface SalesChartProps {
  data: SalesData[];
}

type ChartType = "area" | "bar";
type Period = "7" | "14" | "30";

export function SalesChart({ data }: SalesChartProps) {
  const [chartType, setChartType] = useState<ChartType>("area");
  const [period, setPeriod] = useState<Period>("7");

  // 期間でフィルタリング
  const filteredData = data.slice(-Number(period));

  // 日付を短い形式に変換
  const formattedData = filteredData.map((d) => ({
    ...d,
    displayDate: d.date.slice(5).replace("-", "/"),
  }));

  // 合計計算
  const totalSales = filteredData.reduce((sum, d) => sum + d.totalSalesInclTax, 0);
  const totalOrders = filteredData.reduce((sum, d) => sum + d.totalOrders, 0);
  const avgSales = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">{label}</p>
          <p className="text-lg font-bold text-gray-900">
            ¥{Number(payload[0].value).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">売上推移</CardTitle>
              <p className="text-sm text-gray-500">直近{period}日間の売上データ</p>
            </div>
          </div>
          <div className="flex gap-2">
            {/* 期間選択 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["7", "14", "30"] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant="ghost"
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={`px-3 h-8 rounded-md transition-all ${
                    period === p
                      ? "bg-white shadow-sm text-primary font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {p}日
                </Button>
              ))}
            </div>
            {/* チャートタイプ選択 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType("area")}
                className={`px-3 h-8 rounded-md transition-all ${
                  chartType === "area"
                    ? "bg-white shadow-sm text-primary"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <LineChart className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType("bar")}
                className={`px-3 h-8 rounded-md transition-all ${
                  chartType === "bar"
                    ? "bg-white shadow-sm text-primary"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* サマリー */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
            <div className="text-sm text-gray-500 mb-1">期間売上（税込）</div>
            <div className="text-2xl font-bold text-gray-900">
              ¥{totalSales.toLocaleString()}
            </div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
            <div className="text-sm text-gray-500 mb-1">期間注文数</div>
            <div className="text-2xl font-bold text-gray-900">{totalOrders}件</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
            <div className="text-sm text-gray-500 mb-1">平均注文額</div>
            <div className="text-2xl font-bold text-gray-900">
              ¥{avgSales.toLocaleString()}
            </div>
          </div>
        </div>

        {/* グラフ */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={formattedData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  tickMargin={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
                  }
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalSalesInclTax"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#colorSales)"
                  dot={false}
                  activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={formattedData}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  tickMargin={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
                  }
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="totalSalesInclTax"
                  fill="url(#colorBar)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

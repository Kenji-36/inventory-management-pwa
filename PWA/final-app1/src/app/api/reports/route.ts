/**
 * レポート集計API
 * 
 * GET /api/reports
 * 
 * クエリパラメータ:
 *   - start: 開始日（YYYY-MM-DD）
 *   - end: 終了日（YYYY-MM-DD）
 *   - compare: 比較モード（'prev_month' | 'prev_year'）
 *   - sort_by: ソートカラム
 *   - sort_order: ソート方向（'asc' | 'desc'）
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { supabaseServer } from "@/lib/supabase-server";

interface DailySales {
  date: string;
  orderCount: number;
  totalExclTax: number;
  totalInclTax: number;
  itemCount: number;
}

interface ProductSales {
  productId: number;
  productName: string;
  productCode: string;
  totalQuantity: number;
  totalExclTax: number;
  totalInclTax: number;
  orderCount: number;
}

interface PeriodSummary {
  totalOrders: number;
  totalSalesExclTax: number;
  totalSalesInclTax: number;
  totalItems: number;
  averageOrderValue: number;
  dailySales: DailySales[];
  productSales: ProductSales[];
}

interface OrderRow {
  id: number;
  order_date: string;
  item_count: number;
  total_price_excluding_tax: number;
  total_price_including_tax: number;
}

async function getPeriodData(startDate: string, endDate: string): Promise<PeriodSummary> {
  // 注文データ取得
  const { data, error: ordersError } = await supabaseServer
    .from('orders')
    .select('id, order_date, item_count, total_price_excluding_tax, total_price_including_tax')
    .gte('order_date', startDate)
    .lte('order_date', endDate)
    .order('order_date', { ascending: true });

  const orders: OrderRow[] = data || [];

  if (ordersError) {
    console.error('レポート注文取得エラー:', ordersError);
    throw new Error('注文データの取得に失敗しました');
  }

  // 注文明細を取得（商品別集計用）
  const orderIds = orders.map(o => o.id);
  let allDetails: Array<{
    order_id: number;
    product_id: number;
    quantity: number;
    subtotal_excluding_tax: number;
    subtotal_including_tax: number;
    products: { name: string; product_code: string } | null;
  }> = [];

  if (orderIds.length > 0) {
    // バッチで取得（Supabaseの制限を考慮）
    const batchSize = 100;
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batch = orderIds.slice(i, i + batchSize);
      const { data: details } = await supabaseServer
        .from('order_details')
        .select('order_id, product_id, quantity, subtotal_excluding_tax, subtotal_including_tax, products(name, product_code)')
        .in('order_id', batch);
      if (details) allDetails = [...allDetails, ...details];
    }
  }

  // 日別集計
  const dailyMap = new Map<string, DailySales>();
  for (const order of orders) {
    const date = order.order_date;
    const existing = dailyMap.get(date) || {
      date,
      orderCount: 0,
      totalExclTax: 0,
      totalInclTax: 0,
      itemCount: 0,
    };
    existing.orderCount += 1;
    existing.totalExclTax += order.total_price_excluding_tax || 0;
    existing.totalInclTax += order.total_price_including_tax || 0;
    existing.itemCount += order.item_count || 0;
    dailyMap.set(date, existing);
  }

  // 商品別集計
  const productMap = new Map<number, ProductSales>();
  for (const detail of allDetails) {
    const pid = detail.product_id;
    const existing = productMap.get(pid) || {
      productId: pid,
      productName: detail.products?.name || `商品ID: ${pid}`,
      productCode: detail.products?.product_code || '',
      totalQuantity: 0,
      totalExclTax: 0,
      totalInclTax: 0,
      orderCount: 0,
    };
    existing.totalQuantity += detail.quantity || 0;
    existing.totalExclTax += detail.subtotal_excluding_tax || 0;
    existing.totalInclTax += detail.subtotal_including_tax || 0;
    existing.orderCount += 1;
    productMap.set(pid, existing);
  }

  const totalOrders = orders.length;
  const totalSalesExclTax = orders.reduce((sum: number, o) => sum + (o.total_price_excluding_tax || 0), 0);
  const totalSalesInclTax = orders.reduce((sum: number, o) => sum + (o.total_price_including_tax || 0), 0);
  const totalItems = orders.reduce((sum: number, o) => sum + (o.item_count || 0), 0);

  return {
    totalOrders,
    totalSalesExclTax,
    totalSalesInclTax,
    totalItems,
    averageOrderValue: totalOrders > 0 ? Math.round(totalSalesInclTax / totalOrders) : 0,
    dailySales: Array.from(dailyMap.values()),
    productSales: Array.from(productMap.values()).sort((a, b) => b.totalInclTax - a.totalInclTax),
  };
}

function getComparisonPeriod(startDate: string, endDate: string, mode: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (mode === 'prev_month') {
    start.setMonth(start.getMonth() - 1);
    end.setMonth(end.getMonth() - 1);
  } else if (mode === 'prev_year') {
    start.setFullYear(start.getFullYear() - 1);
    end.setFullYear(end.getFullYear() - 1);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authenticated) return auth.response;

  const rateLimit = await checkRateLimit(`reports-get-${auth.user.email}`, 10);
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit.resetTime);

  try {
    const { searchParams } = new URL(request.url);

    // デフォルト: 今月
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = now.toISOString().split('T')[0];

    const startDate = searchParams.get('start') || defaultStart;
    const endDate = searchParams.get('end') || defaultEnd;
    const compare = searchParams.get('compare'); // 'prev_month' | 'prev_year'
    const sortBy = searchParams.get('sort_by') || 'totalInclTax';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // メイン期間のデータ取得
    const current = await getPeriodData(startDate, endDate);

    // ソート適用（商品別売上）
    const sortKey = sortBy as keyof ProductSales;
    current.productSales.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    // 比較期間のデータ取得
    let comparison: PeriodSummary | null = null;
    let comparisonPeriod: { start: string; end: string } | null = null;
    if (compare) {
      comparisonPeriod = getComparisonPeriod(startDate, endDate, compare);
      comparison = await getPeriodData(comparisonPeriod.start, comparisonPeriod.end);
    }

    return NextResponse.json({
      success: true,
      period: { start: startDate, end: endDate },
      current,
      comparison,
      comparisonPeriod,
    });
  } catch (error) {
    console.error('レポート集計エラー:', error);
    return NextResponse.json(
      { success: false, error: 'レポートの生成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 入出庫履歴記録ヘルパー
 * 
 * 在庫の変動をstock_movementsテーブルに記録します。
 * Service Role Key を使用して、RLSをバイパスして書き込みます。
 */

import { supabaseServer } from "@/lib/supabase-server";

export type MovementType = 'in' | 'out' | 'adjust' | 'order';

export interface StockMovementEntry {
  productId: number;
  userId?: string | null;
  userEmail?: string | null;
  movementType: MovementType;
  quantity: number;           // 変動量（正: 入庫、負: 出庫）
  previousQuantity: number;   // 変更前の在庫数
  newQuantity: number;        // 変更後の在庫数
  reason?: string | null;     // 理由・メモ
  orderId?: number | null;    // 注文ID（注文による出庫の場合）
}

/**
 * 入出庫履歴を記録する
 * 
 * @example
 * ```ts
 * await recordStockMovement({
 *   productId: 1,
 *   userId: user.id,
 *   userEmail: user.email,
 *   movementType: 'in',
 *   quantity: 10,
 *   previousQuantity: 5,
 *   newQuantity: 15,
 *   reason: '仕入れ入庫',
 * });
 * ```
 */
export async function recordStockMovement(entry: StockMovementEntry): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from('stock_movements')
      .insert({
        product_id: entry.productId,
        user_id: entry.userId || null,
        user_email: entry.userEmail || null,
        movement_type: entry.movementType,
        quantity: entry.quantity,
        previous_quantity: entry.previousQuantity,
        new_quantity: entry.newQuantity,
        reason: entry.reason || null,
        order_id: entry.orderId || null,
      });

    if (error) {
      console.error('入出庫履歴記録エラー:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('入出庫履歴記録例外:', error);
    return false;
  }
}

/**
 * 複数の入出庫履歴を一括記録する（注文時など）
 */
export async function recordStockMovementBatch(entries: StockMovementEntry[]): Promise<boolean> {
  try {
    const records = entries.map(entry => ({
      product_id: entry.productId,
      user_id: entry.userId || null,
      user_email: entry.userEmail || null,
      movement_type: entry.movementType,
      quantity: entry.quantity,
      previous_quantity: entry.previousQuantity,
      new_quantity: entry.newQuantity,
      reason: entry.reason || null,
      order_id: entry.orderId || null,
    }));

    const { error } = await supabaseServer
      .from('stock_movements')
      .insert(records);

    if (error) {
      console.error('入出庫履歴一括記録エラー:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('入出庫履歴一括記録例外:', error);
    return false;
  }
}

/**
 * Supabase Realtimeを使用した在庫リアルタイム更新フック
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface StockUpdate {
  id: number;
  product_id: number;
  quantity: number;
  last_stocked_date: string | null;
  updated_at: string;
}

export function useRealtimeStock(onStockUpdate?: (update: StockUpdate) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Realtimeチャンネルの作成
    const stockChannel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE すべてのイベントを監視
          schema: 'public',
          table: 'stock'
        },
        (payload) => {
          console.log('[Realtime] Stock update:', payload);
          
          if (payload.new && onStockUpdate) {
            onStockUpdate(payload.new as StockUpdate);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(stockChannel);

    // クリーンアップ
    return () => {
      console.log('[Realtime] Unsubscribing from stock-changes');
      stockChannel.unsubscribe();
    };
  }, [onStockUpdate]);

  return { isConnected, channel };
}

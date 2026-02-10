/**
 * Supabase Realtimeを使用した注文リアルタイム更新フック
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface OrderUpdate {
  id: number;
  item_count: number;
  total_price_excluding_tax: number;
  total_price_including_tax: number;
  order_date: string;
  created_at: string;
}

export function useRealtimeOrders(onOrderUpdate?: (update: OrderUpdate) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Realtimeチャンネルの作成
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // 新規注文のみ監視
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('[Realtime] New order:', payload);
          
          if (payload.new && onOrderUpdate) {
            onOrderUpdate(payload.new as OrderUpdate);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(ordersChannel);

    // クリーンアップ
    return () => {
      console.log('[Realtime] Unsubscribing from orders-changes');
      ordersChannel.unsubscribe();
    };
  }, [onOrderUpdate]);

  return { isConnected, channel };
}

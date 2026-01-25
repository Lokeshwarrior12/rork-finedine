// hooks/useOrderSubscription.ts

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useOrderSubscription(
  onNewOrder: (order: any) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          onNewOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewOrder]);
}

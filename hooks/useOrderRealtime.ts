import { useEffect, useCallback, useRef } from 'react';
import { supabase, subscribeTable } from '@/lib/supabase';
//
export function useOrderRealtime(onUpdate: (order: any) => void) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;   // always-fresh ref – no stale closure
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      unsub = subscribeTable(
        'orders',
        { event: 'UPDATE', filter: `customer_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            cbRef.current(payload.new);
          }
        }
      );
    })();
    return () => { unsub?.(); };
  }, []);
}

import { useEffect, useRef } from 'react';
import { supabase, realtime } from '@/lib/supabase';
//
export function useOrderRealtime(onUpdate: (order: any) => void) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;   // always-fresh ref – no stale closure
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      unsub = realtime.subscribeTable(
        'orders',
        { event: 'UPDATE', filter: `customer_id=eq.${user.id}` },
        (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            cbRef.current(payload.new);
          }
        }
      );
    })();
    return () => { unsub?.(); };
  }, []);
}

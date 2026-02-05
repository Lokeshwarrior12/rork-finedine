import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/supabase';
import type { Deal } from '@/types';
export function useDeals({ limit = 20, page = 0 } = {}) {
const [deals,   setDeals]   = useState<Deal[]>([]);
const [loading, setLoading] = useState(true);
 const [error,   setError]   = useState<string | null>(null);

 const fetch = useCallback(async () => {
  setLoading(true);
    setError(null);
     try {
      const now = new Date().toISOString();
      const { data } = await db.deals()
         .select('*, restaurant:restaurants(id, name, logo_url, rating)')
         .eq('is_active', true)
         .lte('valid_from', now)
         .gte('valid_until', now)
         .order('discount_percent', { ascending: false })
         .range(page * limit, (page + 1) * limit - 1);

      setDeals(data ?? []);
     } catch (e: any) {
      setError(e.message ?? 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => { fetch(); }, [fetch]);
  return { deals, loading, error, refetch: fetch };
}

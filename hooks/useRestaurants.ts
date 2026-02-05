import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/supabase';
import type { Restaurant } from '@/types';
//
interface UseRestaurantsParams {
  query?:       string;        // debounced search string
  cuisineType?: string | null; // single cuisine filter
  category?:    string | null; // banquet | party | bar | cafe …
  services?:    string[];      // ['buffet','delivery']
  lat?:         number | null;
  lng?:         number | null;
  radius?:      number;        // km – default 5
  limit?:       number;        // page size – default 20
  page?:        number;        // 0-based
}
//
export function useRestaurants({
  query = '',
  cuisineType,
  category,
  services = [],
  lat,
  lng,
  radius = 5,
  limit  = 20,
  page   = 0,
}: UseRestaurantsParams = {}) {
 const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
 const [loading,      setLoading]      = useState(true);
 const [error,        setError]        = useState<string | null>(null);
 const [total,        setTotal]        = useState(0);
 const abortRef                        = useRef<AbortController | null>(null);
//
 const fetch = useCallback(async () => {
//     // Cancel any in-flight request
 abortRef.current?.abort();
 const ctrl = new AbortController();
  abortRef.current = ctrl;
//
     setLoading(true);
     setError(null);

    try {
       // ── build the query ─────────────────────────────────
       let q = db.restaurants()
         .select('*', { count: 'exact' })
         .eq('is_open', true)
         .eq('is_verified', true)
         .order('rating', { ascending: false })
         .range(page * limit, (page + 1) * limit - 1);

//       // text search (name OR description)
       if (query.trim()) {
        q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
       }
//       // cuisine filter
       if (cuisineType) {
         q = q.contains('cuisine_type', [cuisineType]);
       }
//       // category filter
       if (category) {
         q = q.contains('categories', [category]);
       }
       // services filter – every requested service must be true
       // Supabase JSONB: services @> '{"buffet":true}'
       if (services.length) {
         const svcObj: Record<string,boolean> = {};
         services.forEach(s => { svcObj[s] = true; });
         q = q.containedBy('services', svcObj as any);   // adjust if your column is different
       }

       const { data, count } = await q;

       if (ctrl.signal.aborted) return;   // stale request – ignore

       // ── optional client-side geo-sort ────────────────────
       // If lat/lng provided, sort results by distance.
       // For production with 1000+ users you would push this to
       // a Supabase RPC / Edge Function.  This is the quick-win path.
       let sorted = data ?? [];
       if (lat != null && lng != null) {
         sorted = sorted
           .filter(r => r.latitude != null && r.longitude != null)
           .map(r => ({
             ...r,
             _dist: haversine(lat, lng, r.latitude!, r.longitude!),
          }))
           .filter(r => r._dist <= radius)
           .sort((a, b) => a._dist - b._dist);
       }

       setRestaurants(sorted);
       setTotal(count ?? sorted.length);
     } catch (e: any) {
       if (ctrl.signal.aborted) return;
       setError(e.message ?? 'Failed to load restaurants');
     } finally {
       if (!ctrl.signal.aborted) setLoading(false);
     }
   }, [query, cuisineType, category, services, lat, lng, radius, limit, page]);

   useEffect(() => { fetch(); }, [fetch]);
   // expose refetch so parent can force a reload (e.g. after a new favorite)
   return { restaurants, loading, error, total, refetch: fetch };
 }

 // ── Haversine formula ────────────────────────────────────
 function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
   const R = 6371; // Earth radius km
   const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
     Math.sin(dLat/2) * Math.sin(dLat/2) +
     Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
     Math.sin(dLon/2) * Math.sin(dLon/2);
   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 }
 function deg2rad(d: number) { return d * Math.PI / 180; }

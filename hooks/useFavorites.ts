import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '@/lib/supabase';
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(true);
  // load on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await db.favorites()
        .select('restaurant_id')
        .eq('user_id', user.id);
      setFavoriteIds(new Set((data ?? []).map((r: any) => r.restaurant_id)));
      setLoading(false);
    })();
  }, []);
  const toggle = useCallback(async (restaurantId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const wasIn = favoriteIds.has(restaurantId);
    // ── optimistic update ────────────────────────────────
    setFavoriteIds(prev => {
      const next = new Set(prev);
      wasIn ? next.delete(restaurantId) : next.add(restaurantId);
      return next;
    });
    try {
      if (wasIn) {
        await db.favorites()
          .delete()
          .eq('user_id', user.id)
         .eq('restaurant_id', restaurantId);
      } else {
        await (db.favorites() as any)
          .insert({ user_id: user.id, restaurant_id: restaurantId });
      }
    } catch {
      // ── rollback on failure ──────────────────────────────
      setFavoriteIds(prev => {
        const next = new Set(prev);
        wasIn ? next.add(restaurantId) : next.delete(restaurantId);
        return next;
     });
    }
 }, [favoriteIds]);
  const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);
  return { isFavorite, toggle, loading };
}

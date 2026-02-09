import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { restaurants as mockRestaurants } from '@/mocks/data';
import type { Restaurant } from '@/types';

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function transformArray<T>(data: unknown[] | null): T[] {
  if (!data || data.length === 0) return [];
  return data.map(item => snakeToCamel(item as Record<string, unknown>) as unknown as T);
}

interface UseRestaurantsParams {
  query?: string;
  cuisineType?: string | null;
  category?: string | null;
  services?: string[];
  lat?: number | null;
  lng?: number | null;
  radius?: number;
  limit?: number;
  page?: number;
}

export function useRestaurantsSearch({
  query = '',
  cuisineType,
  category,
  lat,
  lng,
  radius = 5,
  limit = 20,
  page = 0,
}: UseRestaurantsParams = {}) {
  return useQuery({
    queryKey: ['restaurantsSearch', query, cuisineType, category, lat, lng, radius, limit, page],
    queryFn: async (): Promise<{ restaurants: Restaurant[]; total: number }> => {
      if (isSupabaseConfigured) {
        try {
          let q = supabase
            .from('restaurants')
            .select('*', { count: 'exact' })
            .order('rating', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

          if (query.trim()) {
            q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
          }
          if (cuisineType) {
            q = q.eq('cuisine_type', cuisineType);
          }
          if (category) {
            q = q.contains('categories', [category]);
          }

          const { data, count, error } = await q;

          if (error) {
            console.warn('[useRestaurantsSearch] Supabase error:', error.message);
          } else if (data) {
            let sorted = transformArray<Restaurant>(data);

            if (lat != null && lng != null) {
              sorted = sorted
                .filter((r: any) => r.latitude != null && r.longitude != null)
                .map((r: any) => ({
                  ...r,
                  distance: haversine(lat, lng, r.latitude, r.longitude),
                }))
                .filter((r: any) => r.distance <= radius)
                .sort((a: any, b: any) => a.distance - b.distance) as Restaurant[];
            }

            console.log('[useRestaurantsSearch] Loaded', sorted.length, 'restaurants from Supabase');
            return { restaurants: sorted, total: count ?? sorted.length };
          }
        } catch (err) {
          console.warn('[useRestaurantsSearch] Supabase fetch failed:', err);
        }
      }

      let filtered = [...mockRestaurants];

      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.cuisineType.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q)
        );
      }
      if (cuisineType) {
        filtered = filtered.filter(r => r.cuisineType.toLowerCase() === cuisineType.toLowerCase());
      }
      if (category) {
        filtered = filtered.filter(r =>
          r.categories.some(c => c.toLowerCase().includes(category.toLowerCase()))
        );
      }

      return { restaurants: filtered as Restaurant[], total: filtered.length };
    },
    staleTime: 30000,
  });
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(d: number) { return d * Math.PI / 180; }

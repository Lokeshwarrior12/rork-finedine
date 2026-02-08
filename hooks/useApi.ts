import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurants as mockRestaurants, deals as mockDeals, services as mockServices, userCoupons as mockCoupons } from '@/mocks/data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Restaurant, Deal, Service, Coupon } from '@/types';

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

export function useRestaurants(params?: {
  query?: string;
  cuisineType?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}) {
  return useQuery({
    queryKey: ['restaurants', params],
    queryFn: async (): Promise<Restaurant[]> => {
      if (isSupabaseConfigured) {
        try {
          let query = supabase.from('restaurants').select('*');

          if (params?.query) {
            query = query.ilike('name', `%${params.query}%`);
          }
          if (params?.cuisineType) {
            query = query.eq('cuisine_type', params.cuisineType);
          }

          const { data, error } = await query;
          if (error) {
            console.warn('[useRestaurants] Supabase error, using mock data:', error.message);
          } else if (data && data.length > 0) {
            console.log('[useRestaurants] Loaded', data.length, 'restaurants from Supabase');
            return transformArray<Restaurant>(data);
          }
        } catch (err) {
          console.warn('[useRestaurants] Supabase fetch failed, using mock data:', err);
        }
      }

      let filtered = [...mockRestaurants];

      if (params?.query) {
        const q = params.query.toLowerCase();
        filtered = filtered.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.cuisineType.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q)
        );
      }

      if (params?.cuisineType) {
        filtered = filtered.filter(r =>
          r.cuisineType.toLowerCase() === params.cuisineType?.toLowerCase()
        );
      }

      if (params?.category) {
        filtered = filtered.filter(r =>
          r.categories.some(c => c.toLowerCase().includes(params.category?.toLowerCase() || ''))
        );
      }

      if (params?.lat && params?.lng && params?.radius) {
        filtered = filtered.map(r => ({
          ...r,
          distance: Math.random() * params.radius!,
        })).sort((a, b) => (a as any).distance - (b as any).distance);
      }

      return filtered as Restaurant[];
    },
    staleTime: 30000,
  });
}

export function useRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: async (): Promise<Restaurant | null> => {
      if (!id) return null;

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            return snakeToCamel(data as Record<string, unknown>) as unknown as Restaurant;
          }
        } catch (err) {
          console.warn('[useRestaurant] Supabase fetch failed:', err);
        }
      }

      return mockRestaurants.find(r => r.id === id) || null;
    },
    enabled: !!id,
  });
}

export function useDeals(params?: { restaurantId?: string }) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: async (): Promise<Deal[]> => {
      if (isSupabaseConfigured) {
        try {
          let query = supabase.from('deals').select('*').eq('is_active', true);

          if (params?.restaurantId) {
            query = query.eq('restaurant_id', params.restaurantId);
          }

          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            console.log('[useDeals] Loaded', data.length, 'deals from Supabase');
            return transformArray<Deal>(data);
          }
        } catch (err) {
          console.warn('[useDeals] Supabase fetch failed:', err);
        }
      }

      let filtered = mockDeals.filter(d => d.isActive);

      if (params?.restaurantId) {
        filtered = filtered.filter(d => d.restaurantId === params.restaurantId);
      }

      return filtered as Deal[];
    },
    staleTime: 60000,
  });
}

export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: async (): Promise<Deal | null> => {
      if (!id) return null;

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('deals')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            return snakeToCamel(data as Record<string, unknown>) as unknown as Deal;
          }
        } catch (err) {
          console.warn('[useDeal] Supabase fetch failed:', err);
        }
      }

      return mockDeals.find(d => d.id === id) || null;
    },
    enabled: !!id,
  });
}

export function useClaimDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: string) => {
      if (isSupabaseConfigured) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          if (userId) {
            const { data: deal } = await supabase
              .from('deals')
              .select('*')
              .eq('id', dealId)
              .single();

            if (deal) {
              const couponCode = `${dealId.slice(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
              const dealData = snakeToCamel(deal as Record<string, unknown>) as unknown as Deal;

              const { data: coupon, error } = await supabase
                .from('coupons')
                .insert([{
                  deal_id: dealId,
                  user_id: userId,
                  deal_title: dealData.title,
                  restaurant_name: dealData.restaurantName,
                  restaurant_image: dealData.restaurantImage,
                  discount_percent: dealData.discountPercent,
                  status: 'active',
                  claimed_at: new Date().toISOString(),
                  expires_at: dealData.validTill,
                  code: couponCode,
                }])
                .select()
                .single();

              if (!error && coupon) {
                await supabase
                  .from('deals')
                  .update({ claimed_coupons: (dealData.claimedCoupons || 0) + 1 })
                  .eq('id', dealId);

                return snakeToCamel(coupon as Record<string, unknown>) as unknown as Coupon;
              }
            }
          }
        } catch (err) {
          console.warn('[useClaimDeal] Supabase failed, using mock:', err);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      const deal = mockDeals.find(d => d.id === dealId);
      if (!deal) throw new Error('Deal not found');

      return {
        id: `coupon-${Date.now()}`,
        dealId,
        dealTitle: deal.title,
        restaurantName: deal.restaurantName,
        restaurantImage: deal.restaurantImage,
        discountPercent: deal.discountPercent,
        status: 'active' as const,
        claimedAt: new Date().toISOString(),
        expiresAt: deal.validTill,
        code: `${deal.id.slice(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase()}`,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useServices(restaurantId?: string) {
  return useQuery({
    queryKey: ['services', restaurantId],
    queryFn: async (): Promise<Service[]> => {
      if (isSupabaseConfigured && restaurantId) {
        try {
          const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('restaurant_id', restaurantId);

          if (!error && data && data.length > 0) {
            return transformArray<Service>(data);
          }
        } catch (err) {
          console.warn('[useServices] Supabase fetch failed:', err);
        }
      }

      if (restaurantId) {
        return mockServices.filter(s => s.restaurantId === restaurantId) as Service[];
      }
      return mockServices as Service[];
    },
    enabled: !!restaurantId,
  });
}

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async (): Promise<Coupon[]> => {
      if (isSupabaseConfigured) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          if (userId) {
            const { data, error } = await supabase
              .from('coupons')
              .select('*')
              .eq('user_id', userId);

            if (!error && data && data.length > 0) {
              return transformArray<Coupon>(data);
            }
          }
        } catch (err) {
          console.warn('[useCoupons] Supabase fetch failed:', err);
        }
      }

      return mockCoupons;
    },
  });
}

export function useCreateTableBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string;
      date: string;
      time: string;
      guests: number;
      tableType?: string;
      specialRequests?: string;
    }) => {
      if (isSupabaseConfigured) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          if (userId) {
            const { data: booking, error } = await supabase
              .from('bookings')
              .insert([{
                restaurant_id: data.restaurantId,
                user_id: userId,
                date: data.date,
                time: data.time,
                guests: data.guests,
                table_type: data.tableType || 'standard',
                special_requests: data.specialRequests,
                status: 'pending',
                type: 'table',
              }])
              .select()
              .single();

            if (!error && booking) {
              return snakeToCamel(booking as Record<string, unknown>);
            }
          }
        } catch (err) {
          console.warn('[useCreateTableBooking] Supabase failed:', err);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        id: `booking-${Date.now()}`,
        ...data,
        userId: 'mock-user',
        status: 'pending' as const,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useCreateServiceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string;
      serviceId: string;
      serviceName: string;
      date: string;
      timeSlot: string;
      guests: number;
      totalPrice: number;
    }) => {
      if (isSupabaseConfigured) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          if (userId) {
            const { data: booking, error } = await supabase
              .from('bookings')
              .insert([{
                restaurant_id: data.restaurantId,
                service_id: data.serviceId,
                service_name: data.serviceName,
                user_id: userId,
                date: data.date,
                time_slot: data.timeSlot,
                guests: data.guests,
                total_price: data.totalPrice,
                status: 'pending',
                type: 'service',
              }])
              .select()
              .single();

            if (!error && booking) {
              return snakeToCamel(booking as Record<string, unknown>);
            }
          }
        } catch (err) {
          console.warn('[useCreateServiceBooking] Supabase failed:', err);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        id: `service-booking-${Date.now()}`,
        ...data,
        userId: 'mock-user',
        status: 'pending' as const,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceBookings'] });
    },
  });
}

export function useTableBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          if (userId) {
            const { data, error } = await supabase
              .from('bookings')
              .select('*')
              .eq('user_id', userId)
              .eq('type', 'table');

            if (!error && data) {
              return transformArray(data);
            }
          }
        } catch (err) {
          console.warn('[useTableBookings] Supabase failed:', err);
        }
      }
      return [];
    },
  });
}

export function useServiceBookings() {
  return useQuery({
    queryKey: ['serviceBookings'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          if (userId) {
            const { data, error } = await supabase
              .from('bookings')
              .select('*')
              .eq('user_id', userId)
              .eq('type', 'service');

            if (!error && data) {
              return transformArray(data);
            }
          }
        } catch (err) {
          console.warn('[useServiceBookings] Supabase failed:', err);
        }
      }
      return [];
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          if (userId) {
            const { data, error } = await supabase
              .from('orders')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            if (!error && data) {
              return transformArray(data);
            }
          }
        } catch (err) {
          console.warn('[useOrders] Supabase failed:', err);
        }
      }
      return [];
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string;
      items: { id: string; name: string; price: number; quantity: number }[];
      subtotal: number;
      total: number;
      orderType?: 'dinein' | 'pickup';
      notes?: string;
    }) => {
      if (isSupabaseConfigured) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          if (userId) {
            const { data: order, error } = await supabase
              .from('orders')
              .insert([{
                restaurant_id: data.restaurantId,
                user_id: userId,
                items: data.items,
                subtotal: data.subtotal,
                total: data.total,
                order_type: data.orderType || 'pickup',
                special_instructions: data.notes,
                status: 'pending',
              }])
              .select()
              .single();

            if (!error && order) {
              return snakeToCamel(order as Record<string, unknown>);
            }
          }
        } catch (err) {
          console.warn('[useCreateOrder] Supabase failed:', err);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        id: `order-${Date.now()}`,
        ...data,
        userId: 'mock-user',
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          if (userId) {
            const { data, error } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
              return transformArray(data);
            }
          }
        } catch (err) {
          console.warn('[useNotifications] Supabase failed:', err);
        }
      }

      return [
        {
          id: '1',
          title: 'Welcome to PrimeDine!',
          message: 'Start exploring deals and restaurants near you.',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'New Deal Available',
          message: '30% off at The Golden Fork this weekend!',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);
        } catch (err) {
          console.warn('[useMarkNotificationRead] Supabase failed:', err);
        }
      }
      console.log('[Notifications] Marking as read:', id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

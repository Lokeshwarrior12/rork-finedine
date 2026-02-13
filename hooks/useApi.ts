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

              const { data: coupon, error } = await (supabase
                .from('coupons') as any)
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
                await (supabase
                  .from('deals') as any)
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
            const { data: booking, error } = await (supabase
              .from('bookings') as any)
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
            const { data: booking, error } = await (supabase
              .from('bookings') as any)
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
            const { data: order, error } = await (supabase
              .from('orders') as any)
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
          await (supabase
            .from('notifications') as any)
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

export function useMenuItems(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['menuItems', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('category', { ascending: true });

          if (!error && data) {
            console.log('[useMenuItems] Loaded', data.length, 'items from Supabase');
            return transformArray<{
              id: string;
              restaurantId: string;
              name: string;
              description?: string;
              price: number;
              category?: string;
              image?: string;
              isAvailable?: boolean;
              isVegetarian?: boolean;
              isVegan?: boolean;
              isGlutenFree?: boolean;
            }>(data);
          }
        } catch (err) {
          console.warn('[useMenuItems] Supabase fetch failed:', err);
        }
      }

      return [];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string;
      name: string;
      description?: string;
      price: number;
      category?: string;
      isVegetarian?: boolean;
      isVegan?: boolean;
      isGlutenFree?: boolean;
      isAvailable?: boolean;
      image?: string;
    }) => {
      if (isSupabaseConfigured) {
        const { data: item, error } = await (supabase
          .from('menu_items') as any)
          .insert([{
            restaurant_id: data.restaurantId,
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category,
            is_vegetarian: data.isVegetarian ?? false,
            is_vegan: data.isVegan ?? false,
            is_gluten_free: data.isGlutenFree ?? false,
            is_available: data.isAvailable ?? true,
            image: data.image,
          }])
          .select()
          .single();

        if (error) throw new Error(error.message);
        return snakeToCamel(item as Record<string, unknown>);
      }
      throw new Error('Supabase not configured');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', variables.restaurantId] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId, ...data }: {
      id: string;
      restaurantId: string;
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      isVegetarian?: boolean;
      isVegan?: boolean;
      isGlutenFree?: boolean;
      isAvailable?: boolean;
      image?: string;
    }) => {
      if (isSupabaseConfigured) {
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.isVegetarian !== undefined) updateData.is_vegetarian = data.isVegetarian;
        if (data.isVegan !== undefined) updateData.is_vegan = data.isVegan;
        if (data.isGlutenFree !== undefined) updateData.is_gluten_free = data.isGlutenFree;
        if (data.isAvailable !== undefined) updateData.is_available = data.isAvailable;
        if (data.image !== undefined) updateData.image = data.image;

        const { data: item, error } = await (supabase
          .from('menu_items') as any)
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return snakeToCamel(item as Record<string, unknown>);
      }
      throw new Error('Supabase not configured');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', variables.restaurantId] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
      }
      throw new Error('Supabase not configured');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menuItems', variables.restaurantId] });
    },
  });
}

export function useFavoriteRestaurants(favoriteIds: string[]) {
  return useQuery({
    queryKey: ['favoriteRestaurants', favoriteIds],
    queryFn: async (): Promise<Restaurant[]> => {
      if (!favoriteIds || favoriteIds.length === 0) return [];

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .in('id', favoriteIds);

          if (!error && data) {
            console.log('[useFavoriteRestaurants] Loaded', data.length, 'favorites from Supabase');
            return transformArray<Restaurant>(data);
          }
        } catch (err) {
          console.warn('[useFavoriteRestaurants] Supabase fetch failed:', err);
        }
      }

      return mockRestaurants.filter(r => favoriteIds.includes(r.id)) as Restaurant[];
    },
    enabled: favoriteIds.length > 0,
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (data: { userId: string; name?: string; phone?: string; address?: string }) => {
      if (isSupabaseConfigured) {
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.address !== undefined) updateData.address = data.address;

        const { data: user, error } = await (supabase
          .from('users') as any)
          .update(updateData)
          .eq('id', data.userId)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return snakeToCamel(user as Record<string, unknown>);
      }
      throw new Error('Supabase not configured');
    },
  });
}

export function useRestaurantOrders(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurantOrders', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            console.log('[useRestaurantOrders] Loaded', data.length, 'orders from Supabase');
            return transformArray(data);
          }
        } catch (err) {
          console.warn('[useRestaurantOrders] Supabase fetch failed:', err);
        }
      }
      return [];
    },
    enabled: !!restaurantId,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, restaurantId }: { orderId: string; status: string; restaurantId: string }) => {
      if (isSupabaseConfigured) {
        const { data, error } = await (supabase
          .from('orders') as any)
          .update({ status })
          .eq('id', orderId)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return snakeToCamel(data as Record<string, unknown>);
      }
      throw new Error('Supabase not configured');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['restaurantOrders', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRestaurantBookings(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurantBookings', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return transformArray(data);
          }
        } catch (err) {
          console.warn('[useRestaurantBookings] Supabase fetch failed:', err);
        }
      }
      return [];
    },
    enabled: !!restaurantId,
  });
}

export function useInventory(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['inventory', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('name', { ascending: true });

          if (!error && data) {
            console.log('[useInventory] Loaded', data.length, 'items from Supabase');
            return transformArray(data);
          }
        } catch (err) {
          console.warn('[useInventory] Supabase fetch failed:', err);
        }
      }
      return [];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string;
      name: string;
      category?: string;
      quantity: number;
      unit: string;
      minStock?: number;
      costPerUnit?: number;
      supplier?: string;
    }) => {
      if (isSupabaseConfigured) {
        const { data: item, error } = await (supabase
          .from('inventory') as any)
          .insert([{
            restaurant_id: data.restaurantId,
            name: data.name,
            category: data.category,
            quantity: data.quantity,
            unit: data.unit,
            min_stock: data.minStock ?? 10,
            cost_per_unit: data.costPerUnit ?? 0,
            supplier: data.supplier,
          }])
          .select()
          .single();

        if (error) throw new Error(error.message);
        return snakeToCamel(item as Record<string, unknown>);
      }
      throw new Error('Supabase not configured');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.restaurantId] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId, ...data }: {
      id: string;
      restaurantId: string;
      name?: string;
      category?: string;
      quantity?: number;
      unit?: string;
      minStock?: number;
      costPerUnit?: number;
      supplier?: string;
    }) => {
      if (isSupabaseConfigured) {
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.quantity !== undefined) updateData.quantity = data.quantity;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.minStock !== undefined) updateData.min_stock = data.minStock;
        if (data.costPerUnit !== undefined) updateData.cost_per_unit = data.costPerUnit;
        if (data.supplier !== undefined) updateData.supplier = data.supplier;

        const { data: item, error } = await (supabase
          .from('inventory') as any)
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        return snakeToCamel(item as Record<string, unknown>);
      }
      throw new Error('Supabase not configured');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.restaurantId] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
      }
      throw new Error('Supabase not configured');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.restaurantId] });
    },
  });
}

export function useRestaurantDeals(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurantDeals', restaurantId],
    queryFn: async (): Promise<Deal[]> => {
      if (!restaurantId) return [];

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('deals')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            console.log('[useRestaurantDeals] Loaded', data.length, 'deals from Supabase');
            return transformArray<Deal>(data);
          }
        } catch (err) {
          console.warn('[useRestaurantDeals] Supabase fetch failed:', err);
        }
      }
      return mockDeals.filter(d => d.restaurantId === restaurantId) as Deal[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string;
      restaurantName: string;
      restaurantImage?: string;
      title: string;
      description?: string;
      discountPercent: number;
      offerType: string;
      maxCoupons: number;
      minOrder?: number;
      validTill: string;
      daysAvailable?: string[];
      startTime?: string;
      endTime?: string;
      termsConditions?: string;
    }) => {
      if (isSupabaseConfigured) {
        const { data: deal, error } = await (supabase
          .from('deals') as any)
          .insert([{
            restaurant_id: data.restaurantId,
            restaurant_name: data.restaurantName,
            restaurant_image: data.restaurantImage,
            title: data.title,
            description: data.description,
            discount_percent: data.discountPercent,
            offer_type: data.offerType,
            max_coupons: data.maxCoupons,
            min_order: data.minOrder ?? 0,
            valid_till: data.validTill,
            days_available: data.daysAvailable ?? [],
            start_time: data.startTime,
            end_time: data.endTime,
            terms_conditions: data.termsConditions,
            is_active: true,
            claimed_coupons: 0,
          }])
          .select()
          .single();

        if (error) throw new Error(error.message);
        return snakeToCamel(deal as Record<string, unknown>);
      }
      throw new Error('Supabase not configured');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['restaurantDeals', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useFoodWaste(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['foodWaste', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('food_waste')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            return transformArray(data);
          }
        } catch (err) {
          console.warn('[useFoodWaste] Supabase fetch failed:', err);
        }
      }
      return [];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateFoodWaste() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      restaurantId: string;
      itemName: string;
      category?: string;
      quantity: number;
      unit: string;
      reason: string;
      costPerUnit?: number;
      totalCost?: number;
      date: string;
      time: string;
      notes?: string;
    }) => {
      if (isSupabaseConfigured) {
        const { data: record, error } = await (supabase
          .from('food_waste') as any)
          .insert([{
            restaurant_id: data.restaurantId,
            item_name: data.itemName,
            category: data.category,
            quantity: data.quantity,
            unit: data.unit,
            reason: data.reason,
            cost_per_unit: data.costPerUnit ?? 0,
            total_cost: data.totalCost ?? 0,
            date: data.date,
            time: data.time,
            notes: data.notes,
          }])
          .select()
          .single();

        if (error) throw new Error(error.message);
        return snakeToCamel(record as Record<string, unknown>);
      }
      throw new Error('Supabase not configured');
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['foodWaste', variables.restaurantId] });
    },
  });
}

export function useEmployees(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['employees', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('restaurant_id', restaurantId);

          if (!error && data) {
            return transformArray(data);
          }
        } catch (err) {
          console.warn('[useEmployees] Supabase fetch failed:', err);
        }
      }
      return [];
    },
    enabled: !!restaurantId,
  });
}

export function useSchedules(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['schedules', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('week_start_date', { ascending: false });

          if (!error && data) {
            return transformArray(data);
          }
        } catch (err) {
          console.warn('[useSchedules] Supabase fetch failed:', err);
        }
      }
      return [];
    },
    enabled: !!restaurantId,
  });
}

export { snakeToCamel, transformArray };

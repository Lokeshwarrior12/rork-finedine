import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurants as mockRestaurants, deals as mockDeals, services as mockServices } from '@/mocks/data';
import { Restaurant, Deal, Service } from '@/types';

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
    queryFn: async () => {
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
    queryFn: async () => {
      if (!id) return null;
      return mockRestaurants.find(r => r.id === id) || null;
    },
    enabled: !!id,
  });
}

export function useDeals(params?: { restaurantId?: string }) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: async () => {
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
    queryFn: async () => {
      if (!id) return null;
      return mockDeals.find(d => d.id === id) || null;
    },
    enabled: !!id,
  });
}

export function useClaimDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dealId: string) => {
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
    queryFn: async () => {
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
    queryFn: async () => {
      const { userCoupons } = await import('@/mocks/data');
      return userCoupons;
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
      return [];
    },
  });
}

export function useServiceBookings() {
  return useQuery({
    queryKey: ['serviceBookings'],
    queryFn: async () => {
      return [];
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
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
      console.log('[Notifications] Marking as read:', id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

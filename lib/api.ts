// lib/api.ts
// Unified REST API client (replaces tRPC)

import Constants from 'expo-constants';

// ============================================================================
// CONFIG
// ============================================================================

const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api/v1'
  : Constants.expoConfig?.extra?.apiUrl ||
    'https://rork-finedine-api.fly.dev/api/v1';

console.log('🌐 API Base URL:', API_BASE_URL);

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface APIResponse<T> {
  data: T;
  cached?: boolean;
}

export interface APIError {
  error: string;
  details?: string;
}

// ============================================================================
// DOMAIN MODELS
// ============================================================================

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  cuisineTypes: string[];
  priceRange: number;
  rating: number;
  totalReviews: number;
  images: string[];
  openingHours?: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  images: string[];
  isAvailable: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName?: string;
  items: OrderItem[];
  deliveryAddress: string;
  notes?: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  restaurantId: string;
  items: OrderItem[];
  deliveryAddress: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'restaurant_owner' | 'admin';
  loyaltyPoints: number;
  createdAt?: string;
}

export interface Booking {
  id: string;
  userId: string;
  restaurantId: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  specialRequests?: string;
}

export interface CreateBookingRequest {
  restaurantId: string;
  date: string;
  time: string;
  guests: number;
  specialRequests?: string;
}

export interface Favorite {
  id: string;
  userId: string;
  restaurantId: string;
  restaurant?: Restaurant;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'booking' | 'promotion' | 'system';
  isRead: boolean;
  createdAt: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

class APIClient {
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
    console.log('🔐 Auth token', token ? 'set' : 'cleared');
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const { requireAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    if (requireAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    console.log('📡 API Request:', fetchOptions.method || 'GET', endpoint);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        const error: APIError = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', endpoint, data.cached ? '(cached)' : '');
      return data;
    } catch (error) {
      console.error('❌ API Error:', endpoint, error);
      throw error;
    }
  }

  // ============================================================================
  // RESTAURANTS
  // ============================================================================

  getRestaurants() {
    return this.request<Restaurant[]>('/restaurants');
  }

  getRestaurant(id: string) {
    return this.request<Restaurant>(`/restaurants/${id}`);
  }

  getRestaurantMenu(id: string) {
    return this.request<MenuItem[]>(`/restaurants/${id}/menu`);
  }

  // ============================================================================
  // ORDERS
  // ============================================================================

  createOrder(data: CreateOrderRequest) {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  getOrder(id: string) {
    return this.request<Order>(`/orders/${id}`, {
      requireAuth: true,
    });
  }

  getUserOrders(userId: string) {
    return this.request<Order[]>(`/orders/user/${userId}`, {
      requireAuth: true,
    });
  }

  updateOrderStatus(id: string, status: Order['status']) {
    return this.request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      requireAuth: true,
    });
  }

  // ============================================================================
  // USER / PROFILE
  // ============================================================================

  getUserProfile() {
    return this.request<User>('/profile', {
      requireAuth: true,
    });
  }

  updateUserProfile(data: Partial<User>) {
    return this.request<User>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  // ============================================================================
  // BOOKINGS
  // ============================================================================

  createBooking(data: CreateBookingRequest) {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  getUserBookings(userId: string) {
    return this.request<Booking[]>(`/bookings/user/${userId}`, {
      requireAuth: true,
    });
  }

  // ============================================================================
  // FAVORITES
  // ============================================================================

  getFavorites() {
    return this.request<Favorite[]>('/favorites', {
      requireAuth: true,
    });
  }

  addFavorite(restaurantId: string) {
    return this.request<Favorite>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
      requireAuth: true,
    });
  }

  removeFavorite(restaurantId: string) {
    return this.request<{ success: boolean }>(
      `/favorites/${restaurantId}`,
      {
        method: 'DELETE',
        requireAuth: true,
      }
    );
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  getNotifications() {
    return this.request<Notification[]>('/notifications', {
      requireAuth: true,
    });
  }

  markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(
      `/notifications/${id}/read`,
      {
        method: 'PATCH',
        requireAuth: true,
      }
    );
  }

  // ============================================================================
  // HEALTH
  // ============================================================================

  async healthCheck() {
    const response = await fetch(
      `${API_BASE_URL.replace('/api/v1', '')}/health`
    );
    return response.json();
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const api = new APIClient();
export const useAPI = () => api;

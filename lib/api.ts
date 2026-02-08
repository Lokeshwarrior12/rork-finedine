// lib/api.ts
// REST API client to replace tRPC

import Constants from 'expo-constants';

const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api/v1' // Change to your local IP for physical device testing
  : Constants.expoConfig?.extra?.apiUrl || 'https://primedine.fly.dev/';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

class APIClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requireAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers || {}),
    };

    if (requireAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Restaurant APIs
  async getRestaurants() {
    return this.request<{ data: Restaurant[] }>('/restaurants');
  }

  async getRestaurant(id: string) {
    return this.request<{ data: Restaurant }>(`/restaurants/${id}`);
  }

  async getRestaurantMenu(id: string) {
    return this.request<{ data: MenuItem[] }>(`/restaurants/${id}/menu`);
  }

  // Order APIs
  async createOrder(data: CreateOrderRequest) {
    return this.request<{ data: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  async getOrder(id: string) {
    return this.request<{ data: Order }>(`/orders/${id}`, {
      requireAuth: true,
    });
  }

  async getUserOrders(userId: string) {
    return this.request<{ data: Order[] }>(`/orders/user/${userId}`, {
      requireAuth: true,
    });
  }

  // User APIs
  async getUserProfile() {
    return this.request<{ data: User }>('/profile', {
      requireAuth: true,
    });
  }

  async updateUserProfile(data: Partial<User>) {
    return this.request<{ data: User }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  // Booking APIs
  async createBooking(data: CreateBookingRequest) {
    return this.request<{ data: Booking }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  async getUserBookings(userId: string) {
    return this.request<{ data: Booking[] }>(`/bookings/user/${userId}`, {
      requireAuth: true,
    });
  }

  // Favorites APIs
  async addFavorite(restaurantId: string) {
    return this.request<{ data: Favorite }>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
      requireAuth: true,
    });
  }

  async getFavorites() {
    return this.request<{ data: Favorite[] }>('/favorites', {
      requireAuth: true,
    });
  }

  async removeFavorite(restaurantId: string) {
    return this.request<{ success: boolean }>(`/favorites/${restaurantId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  }

  // Notification APIs
  async getNotifications() {
    return this.request<{ data: Notification[] }>('/notifications', {
      requireAuth: true,
    });
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
      requireAuth: true,
    });
  }
}

// Types
export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  cuisineTypes: string[];
  description?: string;
  priceRange: number;
  rating: number;
  totalReviews: number;
  images: string[];
  openingHours: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  images: string[];
  isAvailable: boolean;
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: string;
  notes?: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'restaurant_owner' | 'admin';
  loyaltyPoints: number;
  createdAt: string;
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

// Export singleton instance
export const api = new APIClient(API_BASE_URL);

// Hook for React Query integration
export const useAPI = () => api;

// lib/api.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/* ──────────────────────────────────────────────────────────
   Environment Configuration
────────────────────────────────────────────────────────── */

const extra = Constants.expoConfig?.extra ?? {};

// Determine API URL based on environment
const getAPIUrl = (): string => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'ios') {
      return extra.apiUrl || 'http://localhost:8080/api/v1';
    } else if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      return extra.apiUrl?.replace('localhost', '10.0.2.2') || 'http://10.0.2.2:8080/api/v1';
    }
    return extra.apiUrl || 'http://localhost:8080/api/v1';
  } else {
    // Production mode
    return extra.apiUrlProduction || 'https://rork-finedine-api.fly.dev/api/v1';
  }
};

const API_BASE_URL = getAPIUrl();

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment:', __DEV__ ? 'Development' : 'Production');
console.log('📱 Platform:', Platform.OS);

/* ──────────────────────────────────────────────────────────
   Type Definitions
────────────────────────────────────────────────────────── */

export interface APIResponse<T> {
  data: T;
  cached?: boolean;
  message?: string;
}

export interface APIError {
  error: string;
  details?: string;
  statusCode?: number;
}

/* ──────────────────────────────────────────────────────────
   Domain Models
────────────────────────────────────────────────────────── */

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  cuisineType?: string;
  cuisineTypes?: string[];
  priceRange?: number; // 1-4
  rating?: number;
  totalReviews?: number;
  images?: string[];
  logo?: string;
  openingHours?: string | Record<string, { open: string; close: string }>;
  location?: {
    latitude: number;
    longitude: number;
  };
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  isApproved?: boolean;
  acceptsBooking?: boolean;
  bookingTerms?: string;
  categories?: string[];
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  images?: string[];
  image?: string;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
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
  loyaltyPoints?: number;
  restaurantId?: string; // For restaurant owners
  favorites?: string[];
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
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

export interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold?: number;
  lastUpdated?: string;
}

export interface AnalyticsData {
  revenue: number;
  transactions?: number;
  orders?: number;
  avgOrderValue: number;
  redemptionRate?: number;
  newCustomers: number;
  topItems: Array<{
    id?: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  dailyTrend?: Array<{
    date: string;
    revenue: number;
    transactions?: number;
  }>;
  revenueByDay?: Array<{
    date: string;
    revenue: number;
  }>;
  peakHours?: Array<{
    hour: string;
    transactions: number;
    revenue: number;
  }>;
}

/* ──────────────────────────────────────────────────────────
   API Client Class
────────────────────────────────────────────────────────── */

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  timeout?: number;
}

class APIClient {
  private authToken: string | null = null;
  private readonly baseURL: string;
  private readonly defaultTimeout = 30000; // 30 seconds

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
    console.log('🔐 Auth token', token ? 'set' : 'cleared');
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Core request method with timeout, retry logic, and comprehensive error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const {
      requireAuth = false,
      timeout = this.defaultTimeout,
      ...fetchOptions
    } = options;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requireAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const method = fetchOptions.method || 'GET';
    const url = `${this.baseURL}${endpoint}`;

    console.log(`📡 API Request: ${method} ${endpoint}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData: APIError = await response
          .json()
          .catch(() => ({
            error: 'Unknown error',
            statusCode: response.status,
          }));

        console.error(`❌ API Error [${response.status}]:`, endpoint, errorData);

        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: APIResponse<T> = await response.json();
      console.log(`✅ API Response: ${endpoint}`, data.cached ? '(cached)' : '');

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (error.name === 'AbortError') {
        console.error('⏱️ API Timeout:', endpoint);
        throw new Error('Request timeout. Please try again.');
      }

      // Handle network errors
      if (error.message === 'Network request failed' || error.message.includes('fetch')) {
        console.error('🔌 Network Error:', endpoint);
        throw new Error('Unable to connect. Please check your internet connection.');
      }

      // Re-throw other errors
      console.error('❌ API Error:', endpoint, error);
      throw error;
    }
  }

  /* ──────────────────────────────────────────────────────────
     RESTAURANTS (Public & Owner)
  ────────────────────────────────────────────────────────── */

  /**
   * Get all active restaurants
   */
  getRestaurants() {
    return this.request<Restaurant[]>('/restaurants');
  }

  /**
   * Get single restaurant by ID
   */
  getRestaurant(id: string) {
    return this.request<Restaurant>(`/restaurants/${id}`);
  }

  /**
   * Get menu items for a restaurant
   */
  getRestaurantMenu(id: string) {
    return this.request<MenuItem[]>(`/restaurants/${id}/menu`);
  }

  /**
   * Search restaurants with filters
   */
  searchRestaurants(query: string, filters?: { cuisineType?: string; priceRange?: number }) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (filters?.cuisineType) params.append('cuisine', filters.cuisineType);
    if (filters?.priceRange) params.append('priceRange', String(filters.priceRange));

    return this.request<Restaurant[]>(`/restaurants/search?${params.toString()}`);
  }

  /**
   * Create new restaurant (restaurant owner)
   */
  createRestaurant(data: Partial<Restaurant>) {
    return this.request<Restaurant>('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /**
   * Update restaurant (restaurant owner)
   */
  updateRestaurant(id: string, data: Partial<Restaurant>) {
    return this.request<Restaurant>(`/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /* ──────────────────────────────────────────────────────────
     MENU ITEMS (Restaurant Owner)
  ────────────────────────────────────────────────────────── */

  /**
   * Create menu item
   */
  createMenuItem(restaurantId: string, data: Partial<MenuItem>) {
    return this.request<MenuItem>(`/restaurants/${restaurantId}/menu`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /**
   * Update menu item
   */
  updateMenuItem(id: string, data: Partial<MenuItem>) {
    return this.request<MenuItem>(`/menu-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /**
   * Delete menu item
   */
  deleteMenuItem(id: string) {
    return this.request<{ success: boolean }>(`/menu-items/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  }

  /**
   * Toggle menu item availability
   */
  toggleMenuItemAvailability(id: string, isAvailable: boolean) {
    return this.updateMenuItem(id, { isAvailable });
  }

  /* ──────────────────────────────────────────────────────────
     ORDERS (Customer & Owner)
  ────────────────────────────────────────────────────────── */

  /**
   * Create new order
   */
  createOrder(data: CreateOrderRequest) {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /**
   * Get single order by ID
   */
  getOrder(id: string) {
    return this.request<Order>(`/orders/${id}`, {
      requireAuth: true,
    });
  }

  /**
   * Get all orders for a user
   */
  getUserOrders(userId: string) {
    return this.request<Order[]>(`/orders/user/${userId}`, {
      requireAuth: true,
    });
  }

  /**
   * Get all orders for a restaurant
   */
  getRestaurantOrders(restaurantId: string) {
    return this.request<Order[]>(`/restaurants/${restaurantId}/orders`, {
      requireAuth: true,
    });
  }

  /**
   * Update order status (restaurant owner)
   */
  updateOrderStatus(id: string, status: Order['status']) {
    return this.request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      requireAuth: true,
    });
  }

  /**
   * Cancel order (customer)
   */
  cancelOrder(id: string) {
    return this.updateOrderStatus(id, 'cancelled');
  }

  /* ──────────────────────────────────────────────────────────
     USER PROFILE
  ────────────────────────────────────────────────────────── */

  /**
   * Get current user profile
   */
  getUserProfile() {
    return this.request<User>('/profile', {
      requireAuth: true,
    });
  }

  /**
   * Update user profile
   */
  updateUserProfile(data: Partial<User>) {
    return this.request<User>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /**
   * Create user profile (called after signup)
   */
  createUserProfile(data: Partial<User>) {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /* ──────────────────────────────────────────────────────────
     BOOKINGS
  ────────────────────────────────────────────────────────── */

  /**
   * Create new booking
   */
  createBooking(data: CreateBookingRequest) {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /**
   * Get user's bookings
   */
  getUserBookings(userId: string) {
    return this.request<Booking[]>(`/bookings/user/${userId}`, {
      requireAuth: true,
    });
  }

  /**
   * Get restaurant's bookings
   */
  getRestaurantBookings(restaurantId: string) {
    return this.request<Booking[]>(`/restaurants/${restaurantId}/bookings`, {
      requireAuth: true,
    });
  }

  /**
   * Update booking status
   */
  updateBookingStatus(id: string, status: Booking['status']) {
    return this.request<Booking>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      requireAuth: true,
    });
  }

  /* ──────────────────────────────────────────────────────────
     FAVORITES
  ────────────────────────────────────────────────────────── */

  /**
   * Get user's favorite restaurants
   */
  getFavorites() {
    return this.request<Favorite[]>('/favorites', {
      requireAuth: true,
    });
  }

  /**
   * Add restaurant to favorites
   */
  addFavorite(restaurantId: string) {
    return this.request<Favorite>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
      requireAuth: true,
    });
  }

  /**
   * Remove restaurant from favorites
   */
  removeFavorite(restaurantId: string) {
    return this.request<{ success: boolean }>(`/favorites/${restaurantId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  }

  /* ──────────────────────────────────────────────────────────
     NOTIFICATIONS
  ────────────────────────────────────────────────────────── */

  /**
   * Get user notifications
   */
  getNotifications() {
    return this.request<Notification[]>('/notifications', {
      requireAuth: true,
    });
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
      requireAuth: true,
    });
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/notifications/read-all', {
      method: 'PATCH',
      requireAuth: true,
    });
  }

  /* ──────────────────────────────────────────────────────────
     INVENTORY (Restaurant Owner)
  ────────────────────────────────────────────────────────── */

  /**
   * Get restaurant inventory
   */
  getRestaurantInventory(restaurantId: string) {
    return this.request<InventoryItem[]>(`/restaurants/${restaurantId}/inventory`, {
      requireAuth: true,
    });
  }

  /**
   * Create inventory item
   */
  createInventoryItem(restaurantId: string, data: Partial<InventoryItem>) {
    return this.request<InventoryItem>(`/restaurants/${restaurantId}/inventory`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /**
   * Update inventory item
   */
  updateInventoryItem(id: string, data: Partial<InventoryItem>) {
    return this.request<InventoryItem>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    });
  }

  /**
   * Delete inventory item
   */
  deleteInventoryItem(id: string) {
    return this.request<{ success: boolean }>(`/inventory/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    });
  }

  /* ──────────────────────────────────────────────────────────
     ANALYTICS (Restaurant Owner)
  ────────────────────────────────────────────────────────── */

  /**
   * Get restaurant analytics
   * @param period - 'today' | 'week' | 'month'
   */
  getRestaurantAnalytics(restaurantId: string, period: 'today' | 'week' | 'month' = 'today') {
    return this.request<AnalyticsData>(
      `/restaurants/${restaurantId}/analytics?period=${period}`,
      {
        requireAuth: true,
      }
    );
  }

  /* ──────────────────────────────────────────────────────────
     HEALTH CHECK
  ────────────────────────────────────────────────────────── */

  /**
   * Check backend health status
   */
  async healthCheck(): Promise<{
    status: string;
    database: boolean;
    cache: boolean;
    timestamp: string;
  }> {
    try {
      const response = await fetch(this.baseURL.replace('/api/v1', '/health'));
      const data = await response.json();
      console.log('💚 Health Check:', data);
      return data;
    } catch (error) {
      console.error('❌ Health Check Failed:', error);
      throw error;
    }
  }
}

/* ──────────────────────────────────────────────────────────
   Export Singleton Instance
────────────────────────────────────────────────────────── */

export const api = new APIClient();

/**
 * Hook for accessing API client
 */
export const useAPI = () => api;

export default api;

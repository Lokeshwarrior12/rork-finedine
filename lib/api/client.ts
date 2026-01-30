import { config } from '../config';

const API_URL = config.api.url;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

export class APIClient {
  private static async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {}, token } = options;

    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Public endpoints
  static async getRestaurants(filters?: any) {
    return this.request('/api/v1/restaurants', {
      method: 'GET',
    });
  }

  static async getRestaurantById(id: string) {
    return this.request(`/api/v1/restaurants/${id}`);
  }

  static async getDeals() {
    return this.request('/api/v1/deals');
  }

  // Protected endpoints (require token)
  static async createOrder(token: string, orderData: any) {
    return this.request('/api/v1/orders', {
      method: 'POST',
      body: orderData,
      token,
    });
  }

  static async getUserOrders(token: string) {
    return this.request('/api/v1/orders', { token });
  }

  static async createBooking(token: string, bookingData: any) {
    return this.request('/api/v1/bookings', {
      method: 'POST',
      body: bookingData,
      token,
    });
  }

  // Add more methods as needed...
}

import { config } from '../config';
import { auth } from '../supabase';

const API_URL = config.api.url;

async function getAuthHeaders() {
  const session = await auth.getSession();
  const token = session?.access_token;

  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async patch<T>(endpoint: string, data: any): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },
};

// Restaurant API
export const restaurantAPI = {
  getAll: () => api.get('/api/v1/restaurants'),
  getById: (id: string) => api.get(`/api/v1/restaurants/${id}`),
  getNearby: (lat: number, lng: number) => 
    api.get(`/api/v1/restaurants/nearby?latitude=${lat}&longitude=${lng}`),
  getMenu: (id: string) => api.get(`/api/v1/restaurants/${id}/menu`),
  search: (query: string) => api.get(`/api/v1/search?q=${query}`),
};

// Order API
export const orderAPI = {
  create: (data: any) => api.post('/api/v1/orders', data),
  getAll: () => api.get('/api/v1/orders'),
  getById: (id: string) => api.get(`/api/v1/orders/${id}`),
  cancel: (id: string) => api.patch(`/api/v1/orders/${id}/cancel`, {}),
};

// Booking API
export const bookingAPI = {
  create: (data: any) => api.post('/api/v1/bookings', data),
  getAll: () => api.get('/api/v1/bookings'),
  getById: (id: string) => api.get(`/api/v1/bookings/${id}`),
  cancel: (id: string) => api.patch(`/api/v1/bookings/${id}/cancel`, {}),
};

// Deals API
export const dealsAPI = {
  getActive: () => api.get('/api/v1/deals'),
  getFeatured: () => api.get('/api/v1/deals/featured'),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => api.get('/api/v1/favorites'),
  add: (restaurantId: string) => api.post('/api/v1/favorites', { restaurant_id: restaurantId }),
  remove: (restaurantId: string) => api.delete(`/api/v1/favorites/${restaurantId}`),
};

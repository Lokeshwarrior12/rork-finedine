// lib/api.ts
// Central REST API client (Go / Rork backend)
// Safe for Expo + Supabase Auth

import { supabase } from './supabase';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_RORK_API_BASE_URL ??
  '';

if (!API_BASE_URL) {
  console.warn('⚠️ EXPO_PUBLIC_API_URL is not set');
}

/* -------------------------------------------------------------------------- */
/*                               Auth helper                                  */
/* -------------------------------------------------------------------------- */

async function getAuthToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Auth session error:', error.message);
      return null;
    }
    return data.session?.access_token ?? null;
  } catch (err) {
    console.error('Failed to get auth token:', err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                            Generic API request                              */
/* -------------------------------------------------------------------------- */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function apiRequest<T>(
  method: HttpMethod,
  endpoint: string,
  options?: {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
  }
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('API base URL not configured');
  }

  const token = await getAuthToken();

  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = 'API request failed';
    try {
      const errorData = await response.json();
      message = errorData?.message ?? message;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(`${message} (HTTP ${response.status})`);
  }

  // Handle empty responses (204)
  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

/* -------------------------------------------------------------------------- */
/*                                 API Layer                                  */
/* -------------------------------------------------------------------------- */

export const api = {
  /* -------------------------------- Restaurants --------------------------- */
  getRestaurants: (params?: {
    lat?: number;
    lng?: number;
    radius?: number;
  }) =>
    apiRequest<any[]>('GET', '/restaurants', {
      params,
    }),

  getRestaurantById: (id: string) =>
    apiRequest<any>('GET', `/restaurants/${id}`),

  /* -------------------------------- Menu ---------------------------------- */
  getMenuItems: (restaurantId: string) =>
    apiRequest<any[]>('GET', `/menu/${restaurantId}`),

  createMenuItem: (data: any) =>
    apiRequest<any>('POST', '/menu', { body: data }),

  updateMenuItem: (id: string, data: any) =>
    apiRequest<any>('PATCH', `/menu/${id}`, { body: data }),

  deleteMenuItem: (id: string) =>
    apiRequest<void>('DELETE', `/menu/${id}`),

  /* -------------------------------- Orders -------------------------------- */
  getOrders: (status?: string) =>
    apiRequest<any[]>('GET', '/orders', {
      params: status ? { status } : undefined,
    }),

  getOrderById: (id: string) =>
    apiRequest<any>('GET', `/orders/${id}`),

  createOrder: (order: {
    restaurantId: string;
    items: any[];
    subtotal: number;
    total: number;
    notes?: string;
  }) =>
    apiRequest<any>('POST', '/orders', {
      body: order,
    }),

  updateOrderStatus: (orderId: string, status: string) =>
    apiRequest<any>('PATCH', `/orders/${orderId}`, {
      body: { status },
    }),

  /* -------------------------------- Profile ------------------------------- */
  getProfile: () =>
    apiRequest<any>('GET', '/profile'),

  updateProfile: (updates: any) =>
    apiRequest<any>('PATCH', '/profile', {
      body: updates,
    }),

  /* ------------------------------ Health Check ---------------------------- */
  healthCheck: () =>
    apiRequest<{ status: string }>('GET', '/health'),
};

export default api;

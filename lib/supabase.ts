// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/* ──────────────────────────────────────────────────────────
   Environment Configuration
────────────────────────────────────────────────────────── */

const extra = Constants.expoConfig?.extra ?? {};

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  extra.supabaseUrl ??
  '';

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  extra.supabaseAnonKey ??
  '';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  
  if (__DEV__) {
    console.warn(
      '⚠️ Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in app.json extra section'
    );
  }
}

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

console.log('🔧 Supabase Configuration:');
console.log('  URL:', SUPABASE_URL || 'Not set');
console.log('  Key:', SUPABASE_ANON_KEY ? 'Set ✓' : 'Not set ✗');
console.log('  Configured:', isSupabaseConfigured ? 'Yes ✓' : 'No ✗');

/* ──────────────────────────────────────────────────────────
   Database Schema Types
────────────────────────────────────────────────────────── */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          address: string | null;
          role: 'customer' | 'restaurant_owner' | 'admin';
          loyalty_points: number;
          restaurant_id: string | null;
          favorites: string[];
          photo: string | null;
          card_details: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          phone?: string | null;
          address?: string | null;
          role?: 'customer' | 'restaurant_owner' | 'admin';
          loyalty_points?: number;
          restaurant_id?: string | null;
          favorites?: string[];
          photo?: string | null;
          card_details?: any | null;
        };
        Update: {
          email?: string;
          name?: string | null;
          phone?: string | null;
          address?: string | null;
          role?: 'customer' | 'restaurant_owner' | 'admin';
          loyalty_points?: number;
          restaurant_id?: string | null;
          favorites?: string[];
          photo?: string | null;
          card_details?: any | null;
        };
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          address: string;
          city: string | null;
          phone: string | null;
          email: string | null;
          cuisine_types: string[];
          price_range: number;
          rating: number;
          total_reviews: number;
          images: string[];
          logo: string | null;
          opening_hours: any;
          latitude: number | null;
          longitude: number | null;
          is_active: boolean;
          is_approved: boolean;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          price: number;
          category: string;
          is_vegetarian: boolean;
          is_vegan: boolean;
          is_gluten_free: boolean;
          images: string[];
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          items: any[];
          delivery_address: string;
          notes: string | null;
          subtotal: number;
          tax: number;
          delivery_fee: number;
          total: number;
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
          created_at: string;
          updated_at: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          date: string;
          time: string;
          guests: number;
          status: 'pending' | 'confirmed' | 'cancelled';
          special_requests: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          created_at: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          quantity: number;
          unit: string;
          low_stock_threshold: number | null;
          last_updated: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'order' | 'booking' | 'promotion' | 'system';
          is_read: boolean;
          created_at: string;
        };
      };
    };
  };
}

/* ──────────────────────────────────────────────────────────
   Supabase Client
────────────────────────────────────────────────────────── */

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'rork-finedine-mobile',
        },
      },
    })
  : (new Proxy({} as SupabaseClient<Database>, {
      get(_, prop) {
        // Auth methods
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({
              data: { subscription: { unsubscribe: () => {} } },
            }),
            signInWithPassword: async () => ({
              data: { user: null, session: null },
              error: { message: 'Supabase not configured' },
            }),
            signUp: async () => ({
              data: { user: null, session: null },
              error: { message: 'Supabase not configured' },
            }),
            signOut: async () => ({ error: null }),
            refreshSession: async () => ({
              data: { session: null },
              error: { message: 'Supabase not configured' },
            }),
          };
        }

        // Database methods
        if (prop === 'from') {
          return () => ({
            select: () => ({
              data: [],
              error: null,
              eq: () => ({
                data: [],
                error: null,
                maybeSingle: async () => ({ data: null, error: null }),
                single: async () => ({ data: null, error: null }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: null,
                  error: { message: 'Supabase not configured' },
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({
                    data: null,
                    error: { message: 'Supabase not configured' },
                  }),
                }),
              }),
            }),
            delete: () => ({
              eq: () => ({ error: { message: 'Supabase not configured' } }),
            }),
          });
        }

        // Real-time methods
        if (prop === 'channel') {
          return () => ({
            on: () => ({ subscribe: () => ({}) }),
            subscribe: () => ({}),
          });
        }

        if (prop === 'removeChannel') {
          return () => {};
        }

        // Storage methods
        if (prop === 'storage') {
          return {
            from: () => ({
              upload: async () => ({
                data: null,
                error: { message: 'Not configured' },
              }),
              getPublicUrl: () => ({ data: { publicUrl: '' } }),
              remove: async () => ({ error: null }),
            }),
          };
        }

        return undefined;
      },
    }) as unknown as SupabaseClient<Database>);

/* ──────────────────────────────────────────────────────────
   Type Exports
────────────────────────────────────────────────────────── */

export type TypedSupabaseClient = typeof supabase;

/* ──────────────────────────────────────────────────────────
   Auth Helpers
────────────────────────────────────────────────────────── */

export const auth = {
  /**
   * Sign up new user
   */
  signUp: async (
    email: string,
    password: string,
    metadata?: {
      name?: string;
      phone?: string;
      role?: 'customer' | 'restaurant_owner' | 'admin';
    }
  ) => {
    console.log('📝 Signing up user:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }

    console.log('✅ Sign up successful:', data.user?.id);
    return data;
  },

  /**
   * Sign in existing user
   */
  signIn: async (email: string, password: string) => {
    console.log('🔑 Signing in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }

    console.log('✅ Sign in successful:', data.user?.id);
    return data;
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    console.log('👋 Signing out user');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }

    console.log('✅ Sign out successful');
  },

  /**
   * Get current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ Get user error:', error);
      throw error;
    }

    return data.user;
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Get session error:', error);
      throw error;
    }

    return data.session;
  },

  /**
   * Refresh current session
   */
  refreshSession: async () => {
    console.log('🔄 Refreshing session');
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('❌ Refresh session error:', error);
      throw error;
    }

    console.log('✅ Session refreshed');
    return data.session;
  },
};

/* ──────────────────────────────────────────────────────────
   Database Helpers (Typed Access)
────────────────────────────────────────────────────────── */

export const db = {
  from: (table: string) => supabase.from(table),

  users: () => supabase.from('users'),
  restaurants: () => supabase.from('restaurants'),
  menuItems: () => supabase.from('menu_items'),
  orders: () => supabase.from('orders'),
  bookings: () => supabase.from('bookings'),
  favorites: () => supabase.from('favorites'),
  inventory: () => supabase.from('inventory'),
  notifications: () => supabase.from('notifications'),
};

/* ──────────────────────────────────────────────────────────
   Storage Helpers
────────────────────────────────────────────────────────── */

export const storage = {
  /**
   * Upload file to storage bucket
   */
  upload: async (bucket: string, path: string, file: Blob | File) => {
    console.log(`📤 Uploading to ${bucket}/${path}`);
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);

    if (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }

    console.log('✅ Upload successful:', data.path);
    return data;
  },

  /**
   * Get public URL for file
   */
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Delete files from storage
   */
  delete: async (bucket: string, paths: string[]) => {
    console.log(`🗑️ Deleting from ${bucket}:`, paths);
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }

    console.log('✅ Delete successful');
  },
};

/* ──────────────────────────────────────────────────────────
   Real-time Helpers
────────────────────────────────────────────────────────── */

export const realtime = {
  /**
   * Subscribe to table changes
   */
  subscribeTable: (
    table: string,
    opts: {
      filter?: string;
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    },
    callback: (payload: any) => void
  ) => {
    const channelName = `rt-${table}-${Date.now()}`;
    console.log(`📡 Subscribing to ${table} (${opts.event || '*'})`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: opts.event ?? '*',
          schema: 'public',
          table,
          filter: opts.filter,
        },
        (payload) => {
          console.log(`🔔 ${table} change:`, payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status for ${table}:`, status);
      });

    return () => {
      console.log(`🔌 Unsubscribing from ${table}`);
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to specific row changes
   */
  subscribeToRow: (table: string, id: string, callback: (payload: any) => void) => {
    const channelName = `${table}-${id}`;
    console.log(`📡 Subscribing to ${table} row ${id}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log(`🔔 ${table}/${id} updated:`, payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status for ${table}/${id}:`, status);
      });

    return () => {
      console.log(`🔌 Unsubscribing from ${table}/${id}`);
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to order status changes
   */
  subscribeToOrder: (orderId: string, callback: (order: any) => void) => {
    return realtime.subscribeToRow('orders', orderId, callback);
  },

  /**
   * Subscribe to new orders for restaurant
   */
  subscribeToRestaurantOrders: (restaurantId: string, callback: (order: any) => void) => {
    return realtime.subscribeTable(
      'orders',
      {
        filter: `restaurant_id=eq.${restaurantId}`,
        event: 'INSERT',
      },
      callback
    );
  },
};

/* ──────────────────────────────────────────────────────────
   Export Default
────────────────────────────────────────────────────────── */

export default supabase;

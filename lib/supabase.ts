import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/* ──────────────────────────────────────────────────────────
   Environment / Config
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

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY
);

/* ──────────────────────────────────────────────────────────
   Client-side Supabase (App)
────────────────────────────────────────────────────────── */

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/* ──────────────────────────────────────────────────────────
   Server-side Supabase (Edge / Backend only)
   ⚠️ NEVER import this in client components
────────────────────────────────────────────────────────── */

export function createServerSupabase(): SupabaseClient {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/* ──────────────────────────────────────────────────────────
   Auth Helpers
────────────────────────────────────────────────────────── */

export const auth = {
  signUp: async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
};

/* ──────────────────────────────────────────────────────────
   Database Helpers (Typed access points)
────────────────────────────────────────────────────────── */

export const db = {
  from: (table: string) => supabase.from(table),

  users: () => supabase.from('users'),
  restaurants: () => supabase.from('restaurants'),
  menuItems: () => supabase.from('menu_items'),
  deals: () => supabase.from('deals'),
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
  upload: async (bucket: string, path: string, file: Blob | File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    if (error) throw error;
    return data;
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  delete: async (bucket: string, paths: string[]) => {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
  },
};

/* ──────────────────────────────────────────────────────────
   Realtime Helpers
────────────────────────────────────────────────────────── */

export const realtime = {
  subscribeTable: (
    table: string,
    opts: { filter?: string; event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*' },
    callback: (payload: any) => void
  ) => {
    const channel = supabase
      .channel(`rt-${table}-${Date.now()}`)
      .on(
        'postgres_changes' as any,
        {
          event: opts.event ?? '*',
          schema: 'public',
          table,
          filter: opts.filter,
        },
        callback
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  subscribeToRow: (
    table: string,
    id: string,
    callback: (payload: any) => void
  ) => {
    const channel = supabase
      .channel(`${table}-${id}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter: `id=eq.${id}`,
        },
        callback
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};

// lib/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/* ----------------------------------------------------
   READ CONFIG (ENV FIRST, FALLBACK TO app.json)
---------------------------------------------------- */

const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const envSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const extraSupabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  Constants.manifest?.extra?.supabaseUrl;

const extraSupabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  Constants.manifest?.extra?.supabaseAnonKey;

const extraSupabaseServiceKey =
  Constants.expoConfig?.extra?.supabaseServiceKey ??
  Constants.manifest?.extra?.supabaseServiceKey;

const supabaseUrl = envSupabaseUrl || extraSupabaseUrl;
const supabaseAnonKey = envSupabaseAnonKey || extraSupabaseAnonKey;
const supabaseServiceKey = envSupabaseServiceKey || extraSupabaseServiceKey;

/* ----------------------------------------------------
   CREATE CLIENT (Browser/App)
---------------------------------------------------- */

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} else {
  console.warn('⚠️ Supabase not configured');
}

/* ----------------------------------------------------
   CREATE SERVER CLIENT (Backend with Service Role Key)
---------------------------------------------------- */

export function createServerSupabase(): SupabaseClient {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }
  
  const key = supabaseServiceKey || supabaseAnonKey;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is not configured');
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/* ----------------------------------------------------
   FALLBACK CLIENT (NO-OP)
---------------------------------------------------- */

const noopSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: async () => ({ data: null, error: null }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  }),
} as unknown as SupabaseClient;

/* ----------------------------------------------------
   EXPORTS
---------------------------------------------------- */

export const supabase = supabaseClient ?? noopSupabase;
export const isSupabaseConfigured = Boolean(supabaseClient);

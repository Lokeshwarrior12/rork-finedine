// lib/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/* ----------------------------------------------------
   READ FROM app.json -> extra
---------------------------------------------------- */

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  Constants.manifest?.extra?.supabaseUrl;

const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  Constants.manifest?.extra?.supabaseAnonKey;

/* ----------------------------------------------------
   CREATE CLIENT SAFELY
---------------------------------------------------- */

let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });
} else {
  console.warn('⚠️ Supabase not configured — running in tRPC-only auth mode');
}

/* ----------------------------------------------------
   FALLBACK NO-OP CLIENT
---------------------------------------------------- */

const noopSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),

    onAuthStateChange: () => ({
      data: {
        subscription: { unsubscribe: () => {} }
      }
    }),

    signInWithPassword: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null })
  },

  from: () => ({
    select: async () => ({
      data: null,
      error: { message: 'Supabase not configured' }
    })
  })
} as unknown as SupabaseClient;

/* ----------------------------------------------------
   EXPORTS
---------------------------------------------------- */

export const supabase = supabaseClient || noopSupabase;
export const isSupabaseConfigured = !!supabaseClient;

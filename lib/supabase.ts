// lib/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/* ----------------------------------------------------
   READ CONFIG (ENV FIRST, FALLBACK TO app.json)
---------------------------------------------------- */

// Expo env vars (recommended)
const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// app.json / app.config.ts fallback
const extraSupabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  Constants.manifest?.extra?.supabaseUrl;

const extraSupabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  Constants.manifest?.extra?.supabaseAnonKey;

// Final resolved values
const supabaseUrl = envSupabaseUrl || extraSupabaseUrl;
const supabaseAnonKey = envSupabaseAnonKey || extraSupabaseAnonKey;

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
      detectSessionInUrl: false // REQUIRED for React Native
    }
  });
} else {
  console.warn(
    '⚠️ Supabase not configured. Missing URL or Anon Key.'
  );
}

/* ----------------------------------------------------
   FALLBACK NO-OP CLIENT (PREVENTS APP CRASHES)
---------------------------------------------------- */

const noopSupabase = {
  auth: {
    getSession: async () => ({
      data: { session: null },
      error: null
    }),

    onAuthStateChange: () => ({
      data: {
        subscription: { unsubscribe: () => {} }
      }
    }),

    signInWithPassword: async () => ({
      data: null,
      error: null
    }),

    signUp: async () => ({
      data: null,
      error: null
    }),

    signOut: async () => ({
      error: null
    })
  },

  from: () => ({
    select: async () => ({
      data: null,
      error: { message: 'Supabase not configured' }
    }),
    insert: async () => ({
      data: null,
      error: { message: 'Supabase not configured' }
    }),
    update: async () => ({
      data: null,
      error: { message: 'Supabase not configured' }
    }),
    delete: async () => ({
      data: null,
      error: { message: 'Supabase not configured' }
    })
  })
} as unknown as SupabaseClient;

/* ----------------------------------------------------
   EXPORTS
---------------------------------------------------- */

export const supabase = supabaseClient ?? noopSupabase;
export const isSupabaseConfigured = Boolean(supabaseClient);

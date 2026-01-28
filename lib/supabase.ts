// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/* ----------------------------------------------------
   EXPO SAFE CONFIG
---------------------------------------------------- */

// Read from app.json -> expo.extra
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl;

const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey;

// Hard fail with clear message (prevents silent crashes)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config. Check app.json -> expo.extra.supabaseUrl and supabaseAnonKey'
  );
}

/* ----------------------------------------------------
   SUPABASE CLIENT
   (AUTH + REALTIME ONLY — NO DB ACCESS)
---------------------------------------------------- */

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // REQUIRED for React Native / Expo
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/* ----------------------------------------------------
   AUTH HELPERS (EXPLICIT EXPORTS)
---------------------------------------------------- */

export const {
  signInWithPassword,
  signUp,
  signOut,
  getSession,
  getUser,
  onAuthStateChange,
  resetPasswordForEmail,
} = supabase.auth;

/* ----------------------------------------------------
   REALTIME SUBSCRIPTIONS (ALLOWED)
---------------------------------------------------- */

export function subscribeToChannel<T = any>(
  channelName: string,
  callback: (payload: T) => void
) {
  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
      },
      callback
    )
    .subscribe();
}

/* ----------------------------------------------------
   IMPORTANT ARCHITECTURE RULE
---------------------------------------------------- */

/**
 * 🚫 DO NOT USE FROM CLIENT:
 * - supabase.from(...)
 * - supabase.rpc(...)
 * - supabase.storage.from(...)
 *
 * ✅ ALL DATA ACCESS MUST GO THROUGH:
 * - PrimeDine Backend (https://primedine.fly.dev)
 * - OR Supabase Edge Functions
 *
 * This prevents RLS bypass and keeps keys secure.
 */

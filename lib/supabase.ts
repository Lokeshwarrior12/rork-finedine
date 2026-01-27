// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ----------------------------------------------------
   ENV CONFIG (EXPO SAFE)
---------------------------------------------------- */

// These MUST be prefixed with EXPO_PUBLIC_
// Do NOT put service role key here
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase env vars missing. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/* ----------------------------------------------------
   CLIENT (AUTH + REALTIME ONLY)
---------------------------------------------------- */

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // REQUIRED for React Native
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

// Only auth-related helpers are exposed
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
        // table: 'orders', // optional: add table filter when needed
      },
      callback
    )
    .subscribe();
}

/* ----------------------------------------------------
   IMPORTANT RULE (DOCUMENTATION)
---------------------------------------------------- */

/**
 * 🚫 DO NOT:
 * - supabase.from(...)
 * - supabase.rpc(...)
 * - supabase.storage.from(...)
 *
 * from client-side code anymore.
 *
 * ✅ ALL database access MUST go through:
 * - Go backend (REST / gRPC)
 * - or Supabase Edge Functions (server-only)
 */

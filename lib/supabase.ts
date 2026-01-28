// lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ----------------------------------------------------
   ENV CONFIG (EXPO SAFE)
---------------------------------------------------- */

// 🚨 These MUST be prefixed with EXPO_PUBLIC_
// 🚫 NEVER put service role keys here
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ❌ Hard fail if env vars are missing
// This prevents silent crashes and restart loops
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing environment variables: EXPO_PUBLIC_SUPABASE_URL and/or EXPO_PUBLIC_SUPABASE_ANON_KEY'
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
 * - Go backend (REST / gRPC)
 * - OR Supabase Edge Functions
 *
 * This prevents RLS bypass and keeps keys secure.
 */

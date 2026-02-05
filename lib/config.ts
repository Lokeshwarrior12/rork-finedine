import Constants from 'expo-constants';

/* ──────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────── */

interface Config {
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    url: string;
  };
  stripe: {
    publishableKey: string;
  };
  maps: {
    apiKey: string;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  isDevelopment: boolean;
}

/* ──────────────────────────────────────────────────────────
   Expo extra + env
────────────────────────────────────────────────────────── */

const extra = Constants.expoConfig?.extra ?? {};

/**
 * Public API base URL
 * (supports Fly.io / Rork legacy / local dev)
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
  extra.apiUrl ||
  '';

/* ──────────────────────────────────────────────────────────
   Unified Config Object
────────────────────────────────────────────────────────── */

export const config: Config = {
  supabase: {
    url:
      process.env.EXPO_PUBLIC_SUPABASE_URL ??
      extra.supabaseUrl ??
      '',
    anonKey:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      extra.supabaseAnonKey ??
      '',
  },

  api: {
    url: API_URL || 'http://localhost:8080',
  },

  stripe: {
    publishableKey:
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
      '',
  },

  maps: {
    apiKey:
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
      extra.googleMapsApiKey ??
      '',
  },

  firebase: {
    apiKey:
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY ??
      '',
    authDomain:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      '',
    projectId:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
      '',
    storageBucket:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      '',
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
      '',
    appId:
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID ??
      '',
  },

  isDevelopment: __DEV__ || process.env.NODE_ENV === 'development',
};

/* ──────────────────────────────────────────────────────────
   Validation Helper
────────────────────────────────────────────────────────── */

export function validateConfig(): boolean {
  const errors: string[] = [];

  if (!config.supabase.url)
    errors.push('Missing EXPO_PUBLIC_SUPABASE_URL');

  if (!config.supabase.anonKey)
    errors.push('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (!config.api.url)
    errors.push('Missing EXPO_PUBLIC_API_URL');

  if (errors.length > 0) {
    console.warn('⚠️ Configuration warnings:', errors.join(', '));
  }

  return errors.length === 0;
}

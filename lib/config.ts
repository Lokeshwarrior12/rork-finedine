import Constants from 'expo-constants';

interface Config {
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    baseUrl: string;
  };
  maps: {
    apiKey: string;
  };
  isDevelopment: boolean;
}

const extra = Constants.expoConfig?.extra ?? {};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
  extra.apiUrl ||
  '';

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
    baseUrl: API_URL ? `${API_URL}/api/v1` : 'http://localhost:8080/api/v1',
  },

  maps: {
    apiKey:
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
      extra.googleMapsApiKey ??
      '',
  },

  isDevelopment: __DEV__ || process.env.NODE_ENV === 'development',
};

export function validateConfig(): boolean {
  const warnings: string[] = [];

  if (!config.supabase.url)
    warnings.push('Missing EXPO_PUBLIC_SUPABASE_URL');

  if (!config.supabase.anonKey)
    warnings.push('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');

  if (warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:', warnings.join(', '));
  }

  return warnings.length === 0;
}

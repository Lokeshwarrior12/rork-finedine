import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const TOKEN_KEY = 'auth_token';

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.warn("EXPO_PUBLIC_RORK_API_BASE_URL not set");
    return "";
  }

  return url;
};

let cachedToken: string | null = null;

export const getAuthToken = async (): Promise<string | null> => {
  try {
    if (cachedToken) return cachedToken;
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
    return cachedToken;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  cachedToken = token;
};

export const clearAuthToken = () => {
  cachedToken = null;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        const token = await getAuthToken();
        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
      },
      fetch: async (url, options) => {
        const baseUrl = getBaseUrl();
        if (!baseUrl) {
          console.log('No API URL configured, using offline mode');
          throw new Error('Backend not configured. Running in offline mode.');
        }
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          console.error('API fetch error:', error);
          if (error instanceof Error) {
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
              throw new Error('Request timed out. Please check your connection and try again.');
            }
            if (error.message === 'Failed to fetch' || error.message.includes('Network')) {
              throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
            }
          }
          throw error;
        }
      },
    }),
  ],
});

export const createTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers: async () => {
          const token = await getAuthToken();
          return {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };
        },
        fetch: async (url, options) => {
          const baseUrl = getBaseUrl();
          if (!baseUrl) {
            console.log('No API URL configured, using offline mode');
            throw new Error('Backend not configured. Running in offline mode.');
          }
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            console.error('API fetch error:', error);
            if (error instanceof Error) {
              if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                throw new Error('Request timed out. Please check your connection and try again.');
              }
              if (error.message === 'Failed to fetch' || error.message.includes('Network')) {
                throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
              }
            }
            throw error;
          }
        },
      }),
    ],
  });
};

export const checkServerConnection = async (): Promise<boolean> => {
  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      console.log('No base URL configured - running in offline mode');
      return true;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Server health check:', data);
      return true;
    }
    
    console.warn('Server health check returned non-OK status:', response.status);
    return true;
  } catch (error) {
    console.warn('Server connection check failed:', error);
    return true;
  }
};

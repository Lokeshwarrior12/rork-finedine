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
        try {
          const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(15000),
          });
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
          try {
            const response = await fetch(url, {
              ...options,
              signal: AbortSignal.timeout(15000),
            });
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
    if (!baseUrl) return false;
    
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error('Server connection check failed:', error);
    return false;
  }
};

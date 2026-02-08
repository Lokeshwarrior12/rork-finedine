// lib/trpc.ts
import React from 'react';
import 'react-native-url-polyfill/auto';

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';

import type { AppRouter } from '@/backend/trpc/app-router';
import { supabase } from './supabase';

/* ──────────────────────────────────────────────
   Environment / URL resolution
────────────────────────────────────────────── */

const extra = Constants.expoConfig?.extra ?? {};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
  extra.apiUrl ||
  '';

if (!API_BASE_URL) {
  console.warn(
    '⚠️ Missing EXPO_PUBLIC_API_URL or apiUrl in app.json extra'
  );
}

const TRPC_URL = `${API_BASE_URL}/api/trpc`;

/* ──────────────────────────────────────────────
   tRPC instance
────────────────────────────────────────────── */

export const trpc = createTRPCReact<AppRouter>();

/* ──────────────────────────────────────────────
   React Query client (singleton)
────────────────────────────────────────────── */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/* ──────────────────────────────────────────────
   tRPC client (singleton)
────────────────────────────────────────────── */

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: TRPC_URL,
      async headers() {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          const token = session?.access_token;

          return token
            ? { Authorization: `Bearer ${token}` }
            : {};
        } catch (err) {
          console.warn('[tRPC] Failed to attach auth header', err);
          return {};
        }
      },
    }),
  ],
});

/* ──────────────────────────────────────────────
   Provider (MUST wrap app / _layout.tsx)
────────────────────────────────────────────── */

export function TRPCProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */

export type { AppRouter };

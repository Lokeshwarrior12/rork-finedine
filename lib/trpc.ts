import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/backend/trpc/app-router';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_RORK_API_BASE_URL || '';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
      async headers() {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

export type { AppRouter };

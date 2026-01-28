import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { API_URL } from './config';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers: async () => {
        // later: inject Supabase JWT here
        return {};
      },
    }),
  ],
});

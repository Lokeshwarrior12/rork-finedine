import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../backend/root.ts'; // adjust path
import { createContext } from '../../../backend/create-context.ts';

serve(async (req) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });
});

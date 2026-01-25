// backend/trpc.ts
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { Context } from './create-context'; // import from same folder

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user, userId: ctx.userId } });
});

export const restaurantOwnerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // You can fetch role from Supabase here if not in JWT
  if (ctx.user?.role !== 'restaurant_owner') {  // assuming role is in JWT payload
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

// backend/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './trpc/create-context';

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const restaurantOwnerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== 'restaurant_owner') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

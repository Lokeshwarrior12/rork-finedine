// backend/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { Context } from './trpc/create-context';

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
  if (ctx.user?.role !== 'restaurant_owner') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

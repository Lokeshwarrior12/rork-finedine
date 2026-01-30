import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './create-context';

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

export const restaurantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.role !== 'restaurant_owner' || !ctx.restaurantId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be a restaurant owner to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      restaurantId: ctx.restaurantId,
    },
  });
});

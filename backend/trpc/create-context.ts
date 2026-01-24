import { initTRPC, TRPCError } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { verifyToken, JWTPayload } from "@/backend/auth/jwt";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get("authorization");
  let user: JWTPayload | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    user = verifyToken(token);
  }

  return {
    req: opts.req,
    user,
    userId: user?.userId || null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      userId: ctx.userId,
    },
  });
});

export const restaurantOwnerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "restaurant_owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only restaurant owners can access this resource",
    });
  }
  return next({ ctx });
});

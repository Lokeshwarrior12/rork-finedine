import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { Coupon } from "@/types";
import { generateCouponCode } from "@/backend/auth/jwt";

export const couponsRouter = createTRPCRouter({
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    return db.coupons.getByUserId(ctx.userId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const coupon = await db.coupons.getById(input.id);
      if (!coupon) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coupon not found",
        });
      }
      return coupon;
    }),

  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const coupon = await db.coupons.getByCode(input.code);
      if (!coupon) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coupon not found",
        });
      }
      return coupon;
    }),

  claim: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.deals.getById(input.dealId);
      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      if (!deal.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This deal is no longer active",
        });
      }

      if (deal.claimedCoupons >= deal.maxCoupons) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All coupons for this deal have been claimed",
        });
      }

      const expiresAt = new Date(deal.validTill);

      const coupon: Coupon & { userId: string } = {
        id: `coupon_${Date.now()}`,
        dealId: input.dealId,
        userId: ctx.userId,
        dealTitle: deal.title,
        restaurantName: deal.restaurantName,
        restaurantImage: deal.restaurantImage,
        discountPercent: deal.discountPercent,
        status: 'active',
        claimedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        code: generateCouponCode(),
      };

      await db.deals.update(input.dealId, {
        claimedCoupons: deal.claimedCoupons + 1,
      });

      const user = await db.users.getById(ctx.userId);
      if (user) {
        await db.users.update(ctx.userId, { points: user.points + 10 });
      }

      return db.coupons.create(coupon);
    }),

  redeem: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const coupon = await db.coupons.getByCode(input.code);
      if (!coupon) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coupon not found",
        });
      }

      if (coupon.status !== 'active') {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This coupon has already been ${coupon.status}`,
        });
      }

      if (new Date() > new Date(coupon.expiresAt)) {
        await db.coupons.update(coupon.id, { status: 'expired' });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This coupon has expired",
        });
      }

      return db.coupons.update(coupon.id, {
        status: 'used',
        usedAt: new Date().toISOString(),
      });
    }),

  validateCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const coupon = await db.coupons.getByCode(input.code);
      if (!coupon) {
        return { valid: false, message: "Coupon not found" };
      }

      if (coupon.status !== 'active') {
        return { valid: false, message: `Coupon has already been ${coupon.status}` };
      }

      if (new Date() > new Date(coupon.expiresAt)) {
        return { valid: false, message: "Coupon has expired" };
      }

      return {
        valid: true,
        coupon,
        message: `${coupon.discountPercent}% discount available`,
      };
    }),
});

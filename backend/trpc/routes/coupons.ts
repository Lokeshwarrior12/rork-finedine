import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { Coupon } from "@/types";

function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const couponsRouter = createTRPCRouter({
  getMyСoupons: protectedProcedure.query(({ ctx }) => {
    return db.coupons.getByUserId(ctx.userId);
  }),

  getActive: protectedProcedure.query(({ ctx }) => {
    return db.coupons.getByUserId(ctx.userId).filter(c => c.status === 'active');
  }),

  getUsed: protectedProcedure.query(({ ctx }) => {
    return db.coupons.getByUserId(ctx.userId).filter(c => c.status === 'used');
  }),

  getExpired: protectedProcedure.query(({ ctx }) => {
    return db.coupons.getByUserId(ctx.userId).filter(c => c.status === 'expired');
  }),

  claim: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .mutation(({ ctx, input }) => {
      const deal = db.deals.getById(input.dealId);
      if (!deal) throw new Error('Deal not found');
      
      if (!deal.isActive) throw new Error('Deal is no longer active');
      if (deal.claimedCoupons >= deal.maxCoupons) throw new Error('No more coupons available');
      
      const coupon: Coupon = {
        id: `coupon_${Date.now()}`,
        dealId: deal.id,
        dealTitle: deal.title,
        restaurantName: deal.restaurantName,
        restaurantImage: deal.restaurantImage,
        discountPercent: deal.discountPercent,
        status: 'active',
        claimedAt: new Date().toISOString(),
        expiresAt: deal.validTill,
        code: generateCouponCode(),
      };
      
      db.coupons.create(coupon);
      db.deals.update(deal.id, { claimedCoupons: deal.claimedCoupons + 1 });
      
      return coupon;
    }),

  use: protectedProcedure
    .input(z.object({ couponId: z.string() }))
    .mutation(({ input }) => {
      const coupon = db.coupons.getById(input.couponId);
      if (!coupon) throw new Error('Coupon not found');
      if (coupon.status !== 'active') throw new Error('Coupon is not active');
      
      return db.coupons.update(input.couponId, {
        status: 'used',
        usedAt: new Date().toISOString(),
      });
    }),

  verify: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(({ input }) => {
      const coupon = db.coupons.getByCode(input.code);
      if (!coupon) throw new Error('Invalid coupon code');
      if (coupon.status !== 'active') throw new Error('Coupon is not active');
      
      const updated = db.coupons.update(coupon.id, {
        status: 'used',
        usedAt: new Date().toISOString(),
      });
      
      return { coupon: updated, discount: coupon.discountPercent };
    }),

  scratch: protectedProcedure
    .input(z.object({ couponId: z.string() }))
    .query(({ input }) => {
      const coupon = db.coupons.getById(input.couponId);
      if (!coupon) throw new Error('Coupon not found');
      return { code: coupon.code };
    }),

  getQRData: protectedProcedure
    .input(z.object({ couponId: z.string() }))
    .query(({ input }) => {
      const coupon = db.coupons.getById(input.couponId);
      if (!coupon) throw new Error('Coupon not found');
      return {
        code: coupon.code,
        dealTitle: coupon.dealTitle,
        restaurantName: coupon.restaurantName,
        discountPercent: coupon.discountPercent,
        expiresAt: coupon.expiresAt,
      };
    }),
});

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { Deal } from "@/types";

export const dealsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return db.deals.getAll();
  }),

  getActive: publicProcedure.query(async () => {
    return db.deals.getActive();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const deal = await db.deals.getById(input.id);
      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }
      return deal;
    }),

  getByRestaurant: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.deals.getByRestaurantId(input.restaurantId);
    }),

  getHotDeals: publicProcedure.query(async () => {
    const activeDeals = await db.deals.getActive();
    return activeDeals
      .filter(d => d.discountPercent >= 30)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 10);
  }),

  search: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      offerType: z.enum(['dinein', 'pickup', 'both']).optional(),
      minDiscount: z.number().optional(),
      maxDiscount: z.number().optional(),
    }))
    .query(async ({ input }) => {
      let results = await db.deals.getActive();

      if (input.query) {
        const q = input.query.toLowerCase();
        results = results.filter(d =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.restaurantName.toLowerCase().includes(q)
        );
      }

      if (input.offerType) {
        results = results.filter(d => d.offerType === input.offerType || d.offerType === 'both');
      }

      if (input.minDiscount !== undefined) {
        results = results.filter(d => d.discountPercent >= input.minDiscount!);
      }

      if (input.maxDiscount !== undefined) {
        results = results.filter(d => d.discountPercent <= input.maxDiscount!);
      }

      return results;
    }),

  create: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      title: z.string(),
      description: z.string(),
      discountPercent: z.number(),
      offerType: z.enum(['dinein', 'pickup', 'both']),
      maxCoupons: z.number(),
      minOrder: z.number(),
      validTill: z.string(),
      daysAvailable: z.array(z.string()),
      startTime: z.string(),
      endTime: z.string(),
      isActive: z.boolean(),
      termsConditions: z.string(),
    }))
    .mutation(async ({ input }) => {
      const restaurant = await db.restaurants.getById(input.restaurantId);
      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      const deal: Deal = {
        id: `deal_${Date.now()}`,
        restaurantId: input.restaurantId,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.logo || restaurant.images[0] || '',
        title: input.title,
        description: input.description,
        discountPercent: input.discountPercent,
        offerType: input.offerType,
        maxCoupons: input.maxCoupons,
        claimedCoupons: 0,
        minOrder: input.minOrder,
        validTill: input.validTill,
        daysAvailable: input.daysAvailable,
        startTime: input.startTime,
        endTime: input.endTime,
        isActive: input.isActive,
        termsConditions: input.termsConditions,
      };

      const created = await db.deals.create(deal as unknown as Record<string, unknown>);

      if (input.isActive) {
        await db.notifications.notifyFavorites(input.restaurantId, input.title);
      }

      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      discountPercent: z.number().optional(),
      offerType: z.enum(['dinein', 'pickup', 'both']).optional(),
      maxCoupons: z.number().optional(),
      minOrder: z.number().optional(),
      validTill: z.string().optional(),
      daysAvailable: z.array(z.string()).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isActive: z.boolean().optional(),
      termsConditions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const deal = await db.deals.update(id, data);
      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }
      return deal;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deals.delete(input.id);
      return { success: true };
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const deal = await db.deals.getById(input.id);
      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const updated = await db.deals.update(input.id, { isActive: !deal.isActive });

      if (updated?.isActive) {
        await db.notifications.notifyFavorites(deal.restaurantId, deal.title);
      }

      return updated;
    }),
});

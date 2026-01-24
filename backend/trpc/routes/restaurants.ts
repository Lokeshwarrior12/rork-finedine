import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";

export const restaurantsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return db.restaurants.getAll();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const restaurant = await db.restaurants.getById(input.id);
      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }
      return restaurant;
    }),

  getByOwner: protectedProcedure.query(async ({ ctx }) => {
    return db.restaurants.getByOwnerId(ctx.userId);
  }),

  getNearby: publicProcedure
    .input(z.object({ city: z.string().optional() }))
    .query(async ({ input }) => {
      const all = await db.restaurants.getAll();
      if (input.city) {
        return all.filter(r => r.city.toLowerCase().includes(input.city!.toLowerCase()));
      }
      return all;
    }),

  search: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      cuisineType: z.string().optional(),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return db.restaurants.search(input.query, input.cuisineType, input.category);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      cuisineType: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      openingHours: z.string().optional(),
      categories: z.array(z.string()).optional(),
      acceptsTableBooking: z.boolean().optional(),
      bookingTerms: z.string().optional(),
      logo: z.string().optional(),
      images: z.array(z.string()).optional(),
      tables: z.array(z.object({
        id: z.string(),
        number: z.string(),
        capacity: z.number(),
        type: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const restaurant = await db.restaurants.update(id, data);
      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }
      return restaurant;
    }),

  updateImages: protectedProcedure
    .input(z.object({
      id: z.string(),
      images: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const restaurant = await db.restaurants.update(input.id, { images: input.images });
      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }
      return restaurant;
    }),

  updateLogo: protectedProcedure
    .input(z.object({
      id: z.string(),
      logo: z.string(),
    }))
    .mutation(async ({ input }) => {
      const restaurant = await db.restaurants.update(input.id, { logo: input.logo });
      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }
      return restaurant;
    }),

  rate: protectedProcedure
    .input(z.object({
      id: z.string(),
      rating: z.number().min(1).max(5),
    }))
    .mutation(async ({ input }) => {
      const restaurant = await db.restaurants.getById(input.id);
      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      const newReviewCount = restaurant.reviewCount + 1;
      const newRating = ((restaurant.rating * restaurant.reviewCount) + input.rating) / newReviewCount;

      return db.restaurants.update(input.id, {
        rating: Math.round(newRating * 10) / 10,
        reviewCount: newReviewCount,
      });
    }),

  addTable: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      number: z.string(),
      capacity: z.number(),
      type: z.string(),
    }))
    .mutation(async ({ input }) => {
      const restaurant = await db.restaurants.getById(input.restaurantId);
      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      const tables = (restaurant as any).tables || [];
      const newTable = {
        id: `table_${Date.now()}`,
        number: input.number,
        capacity: input.capacity,
        type: input.type,
      };

      return db.restaurants.update(input.restaurantId, {
        tables: [...tables, newTable],
      } as any);
    }),

  removeTable: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      tableId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const restaurant = await db.restaurants.getById(input.restaurantId);
      if (!restaurant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Restaurant not found",
        });
      }

      const tables = ((restaurant as any).tables || []).filter((t: any) => t.id !== input.tableId);

      return db.restaurants.update(input.restaurantId, { tables } as any);
    }),
});

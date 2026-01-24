import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";

export const restaurantsRouter = createTRPCRouter({
  getAll: publicProcedure.query(() => {
    return db.restaurants.getAll();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const restaurant = db.restaurants.getById(input.id);
      if (!restaurant) throw new Error('Restaurant not found');
      return restaurant;
    }),

  getByOwner: protectedProcedure.query(({ ctx }) => {
    return db.restaurants.getByOwnerId(ctx.userId);
  }),

  getNearby: publicProcedure
    .input(z.object({ city: z.string().optional() }))
    .query(({ input }) => {
      const all = db.restaurants.getAll();
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
    .query(({ input }) => {
      let results = db.restaurants.getAll();
      
      if (input.query) {
        const q = input.query.toLowerCase();
        results = results.filter(r => 
          r.name.toLowerCase().includes(q) || 
          r.description.toLowerCase().includes(q) ||
          r.cuisineType.toLowerCase().includes(q)
        );
      }
      
      if (input.cuisineType) {
        results = results.filter(r => r.cuisineType === input.cuisineType);
      }
      
      if (input.category) {
        results = results.filter(r => r.categories.includes(input.category!));
      }
      
      return results;
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
    }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      const restaurant = db.restaurants.update(id, data);
      if (!restaurant) throw new Error('Restaurant not found');
      return restaurant;
    }),

  updateImages: protectedProcedure
    .input(z.object({
      id: z.string(),
      images: z.array(z.string()),
    }))
    .mutation(({ input }) => {
      const restaurant = db.restaurants.update(input.id, { images: input.images });
      if (!restaurant) throw new Error('Restaurant not found');
      return restaurant;
    }),

  updateLogo: protectedProcedure
    .input(z.object({
      id: z.string(),
      logo: z.string(),
    }))
    .mutation(({ input }) => {
      const restaurant = db.restaurants.update(input.id, { logo: input.logo });
      if (!restaurant) throw new Error('Restaurant not found');
      return restaurant;
    }),

  rate: protectedProcedure
    .input(z.object({
      id: z.string(),
      rating: z.number().min(1).max(5),
    }))
    .mutation(({ input }) => {
      const restaurant = db.restaurants.getById(input.id);
      if (!restaurant) throw new Error('Restaurant not found');
      
      const newReviewCount = restaurant.reviewCount + 1;
      const newRating = ((restaurant.rating * restaurant.reviewCount) + input.rating) / newReviewCount;
      
      return db.restaurants.update(input.id, { 
        rating: Math.round(newRating * 10) / 10,
        reviewCount: newReviewCount,
      });
    }),
});

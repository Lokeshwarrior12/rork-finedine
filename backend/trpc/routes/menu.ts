import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db, MenuItem } from "@/backend/db";

export const menuRouter = createTRPCRouter({
  getByRestaurant: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.menuItems.getByRestaurantId(input.restaurantId);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await db.menuItems.getById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }
      return item;
    }),

  create: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      category: z.string(),
      image: z.string().optional(),
      isAvailable: z.boolean().optional(),
      isVegetarian: z.boolean().optional(),
      isVegan: z.boolean().optional(),
      isGlutenFree: z.boolean().optional(),
      spiceLevel: z.number().optional(),
      preparationTime: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const menuItem: MenuItem = {
        id: `menu_${Date.now()}`,
        restaurantId: input.restaurantId,
        name: input.name,
        description: input.description,
        price: input.price,
        category: input.category,
        image: input.image,
        isAvailable: input.isAvailable ?? true,
        isVegetarian: input.isVegetarian ?? false,
        isVegan: input.isVegan ?? false,
        isGlutenFree: input.isGlutenFree ?? false,
        spiceLevel: input.spiceLevel,
        preparationTime: input.preparationTime,
      };

      return db.menuItems.create(menuItem);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      category: z.string().optional(),
      image: z.string().optional(),
      isAvailable: z.boolean().optional(),
      isVegetarian: z.boolean().optional(),
      isVegan: z.boolean().optional(),
      isGlutenFree: z.boolean().optional(),
      spiceLevel: z.number().optional(),
      preparationTime: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updated = await db.menuItems.update(id, data);
      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.menuItems.delete(input.id);
      return { success: true };
    }),

  toggleAvailability: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const item = await db.menuItems.getById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu item not found",
        });
      }
      return db.menuItems.update(input.id, { isAvailable: !item.isAvailable });
    }),

  getCategories: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const items = await db.menuItems.getByRestaurantId(input.restaurantId);
      const categories = [...new Set(items.map(item => item.category))];
      return categories;
    }),
});

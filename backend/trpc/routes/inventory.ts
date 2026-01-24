import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db, InventoryItem } from "@/backend/db";

export const inventoryRouter = createTRPCRouter({
  getByRestaurant: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.inventory.getByRestaurantId(input.restaurantId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await db.inventory.getById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inventory item not found",
        });
      }
      return item;
    }),

  getLowStock: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.inventory.getLowStock(input.restaurantId);
    }),

  create: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      name: z.string(),
      category: z.string(),
      quantity: z.number(),
      unit: z.string(),
      minStock: z.number(),
      costPerUnit: z.number(),
      supplier: z.string().optional(),
      expiryDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const item: InventoryItem = {
        id: `inv_${Date.now()}`,
        restaurantId: input.restaurantId,
        name: input.name,
        category: input.category,
        quantity: input.quantity,
        unit: input.unit,
        minStock: input.minStock,
        costPerUnit: input.costPerUnit,
        supplier: input.supplier,
        expiryDate: input.expiryDate,
        lastRestocked: new Date().toISOString(),
      };

      return db.inventory.create(item);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      category: z.string().optional(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      minStock: z.number().optional(),
      costPerUnit: z.number().optional(),
      supplier: z.string().optional(),
      expiryDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updated = await db.inventory.update(id, data);
      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inventory item not found",
        });
      }
      return updated;
    }),

  restock: protectedProcedure
    .input(z.object({
      id: z.string(),
      quantity: z.number(),
    }))
    .mutation(async ({ input }) => {
      const item = await db.inventory.getById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inventory item not found",
        });
      }

      return db.inventory.update(input.id, {
        quantity: item.quantity + input.quantity,
        lastRestocked: new Date().toISOString(),
      });
    }),

  adjustQuantity: protectedProcedure
    .input(z.object({
      id: z.string(),
      adjustment: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const item = await db.inventory.getById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inventory item not found",
        });
      }

      const newQuantity = Math.max(0, item.quantity + input.adjustment);
      return db.inventory.update(input.id, { quantity: newQuantity });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.inventory.delete(input.id);
      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const items = await db.inventory.getByRestaurantId(input.restaurantId);
      const lowStock = items.filter(i => i.quantity <= i.minStock);
      const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.costPerUnit), 0);
      const categories = [...new Set(items.map(i => i.category))];

      const expiringItems = items.filter(i => {
        if (!i.expiryDate) return false;
        const expiry = new Date(i.expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      });

      return {
        totalItems: items.length,
        lowStockCount: lowStock.length,
        totalValue,
        categories: categories.length,
        expiringCount: expiringItems.length,
        lowStockItems: lowStock.slice(0, 5),
        expiringItems: expiringItems.slice(0, 5),
      };
    }),
});

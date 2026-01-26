import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { FoodWasteRecord, WasteAnalytics } from "@/types";

function toRecord<T extends object>(obj: T): Record<string, unknown> {
  return obj as unknown as Record<string, unknown>;
}

export const foodWasteRouter = createTRPCRouter({
  getByRestaurant: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.foodWaste.getByRestaurantId(input.restaurantId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const record = await db.foodWaste.getById(input.id);
      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food waste record not found",
        });
      }
      return record;
    }),

  getByDateRange: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      return db.foodWaste.getByDateRange(input.restaurantId, input.startDate, input.endDate);
    }),

  create: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      itemName: z.string(),
      category: z.string().optional(),
      quantity: z.number(),
      unit: z.string().optional(),
      reason: z.enum(['expired', 'spoiled', 'overproduction', 'customer_return', 'preparation_error', 'other']).optional(),
      costPerUnit: z.number().optional(),
      notes: z.string().optional(),
      inventoryItemId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const costPerUnit = input.costPerUnit || 0;
      const totalCost = input.quantity * costPerUnit;

      const record: FoodWasteRecord = {
        id: `waste_${Date.now()}`,
        restaurantId: input.restaurantId,
        itemName: input.itemName,
        category: input.category || 'Other',
        quantity: input.quantity,
        unit: input.unit || 'units',
        reason: input.reason || 'other',
        costPerUnit,
        totalCost,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        recordedBy: ctx.userId,
        notes: input.notes,
        inventoryItemId: input.inventoryItemId,
      };

      if (input.inventoryItemId) {
        const inventoryItem = await db.inventory.getById(input.inventoryItemId);
        if (inventoryItem) {
          await db.inventory.update(input.inventoryItemId, {
            quantity: Math.max(0, inventoryItem.quantity - input.quantity),
          });
        }
      }

      return db.foodWaste.create(toRecord(record));
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      itemName: z.string().optional(),
      category: z.string().optional(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      reason: z.enum(['expired', 'spoiled', 'overproduction', 'customer_return', 'preparation_error', 'other']).optional(),
      costPerUnit: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      if (data.quantity !== undefined && data.costPerUnit !== undefined) {
        (data as any).totalCost = data.quantity * data.costPerUnit;
      }

      const updated = await db.foodWaste.update(id, data);
      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Food waste record not found",
        });
      }
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.foodWaste.delete(input.id);
      return { success: true };
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const allRecords = await db.foodWaste.getByRestaurantId(input.restaurantId);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      const thisMonthRecords = allRecords.filter(r => r.date >= thisMonthStart);
      const lastMonthRecords = allRecords.filter(r => r.date >= lastMonthStart && r.date <= lastMonthEnd);

      const totalWasteThisMonth = thisMonthRecords.reduce((sum, r) => sum + r.quantity, 0);
      const totalCostThisMonth = thisMonthRecords.reduce((sum, r) => sum + r.totalCost, 0);
      const totalWasteLastMonth = lastMonthRecords.reduce((sum, r) => sum + r.quantity, 0);
      const totalCostLastMonth = lastMonthRecords.reduce((sum, r) => sum + r.totalCost, 0);

      const wasteByCategory: Record<string, { quantity: number; cost: number }> = {};
      thisMonthRecords.forEach(r => {
        if (!wasteByCategory[r.category]) {
          wasteByCategory[r.category] = { quantity: 0, cost: 0 };
        }
        wasteByCategory[r.category].quantity += r.quantity;
        wasteByCategory[r.category].cost += r.totalCost;
      });

      const wasteByReason: Record<string, { count: number; cost: number }> = {};
      thisMonthRecords.forEach(r => {
        if (!wasteByReason[r.reason]) {
          wasteByReason[r.reason] = { count: 0, cost: 0 };
        }
        wasteByReason[r.reason].count += 1;
        wasteByReason[r.reason].cost += r.totalCost;
      });

      const itemWaste: Record<string, { quantity: number; cost: number; count: number; category: string }> = {};
      thisMonthRecords.forEach(r => {
        if (!itemWaste[r.itemName]) {
          itemWaste[r.itemName] = { quantity: 0, cost: 0, count: 0, category: r.category };
        }
        itemWaste[r.itemName].quantity += r.quantity;
        itemWaste[r.itemName].cost += r.totalCost;
        itemWaste[r.itemName].count += 1;
      });

      const topWastedItems = Object.entries(itemWaste)
        .map(([itemName, data]) => ({
          itemName,
          category: data.category,
          totalQuantity: data.quantity,
          totalCost: data.cost,
          frequency: data.count,
          avgQuantityPerIncident: data.quantity / data.count,
        }))
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 10);

      const recommendations = generateRecommendations(thisMonthRecords, topWastedItems);

      const analytics: WasteAnalytics = {
        totalWasteThisMonth,
        totalCostThisMonth,
        wasteByCategory: Object.entries(wasteByCategory).map(([category, data]) => ({
          category,
          quantity: data.quantity,
          cost: data.cost,
          percentage: totalWasteThisMonth > 0 ? (data.quantity / totalWasteThisMonth) * 100 : 0,
        })),
        wasteByReason: Object.entries(wasteByReason).map(([reason, data]) => ({
          reason,
          count: data.count,
          cost: data.cost,
          percentage: thisMonthRecords.length > 0 ? (data.count / thisMonthRecords.length) * 100 : 0,
        })),
        wasteTrend: generateWasteTrend(thisMonthRecords),
        topWastedItems,
        recommendations,
        comparisonToPreviousMonth: {
          wasteChange: totalWasteLastMonth > 0 
            ? ((totalWasteThisMonth - totalWasteLastMonth) / totalWasteLastMonth) * 100 
            : 0,
          costChange: totalCostLastMonth > 0 
            ? ((totalCostThisMonth - totalCostLastMonth) / totalCostLastMonth) * 100 
            : 0,
        },
      };

      return analytics;
    }),
});

function generateWasteTrend(records: FoodWasteRecord[]) {
  const trendMap: Record<string, { quantity: number; cost: number }> = {};

  records.forEach(r => {
    if (!trendMap[r.date]) {
      trendMap[r.date] = { quantity: 0, cost: 0 };
    }
    trendMap[r.date].quantity += r.quantity;
    trendMap[r.date].cost += r.totalCost;
  });

  return Object.entries(trendMap)
    .map(([date, data]) => ({ date, quantity: data.quantity, cost: data.cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function generateRecommendations(records: FoodWasteRecord[], topWastedItems: any[]) {
  const recommendations = [];

  const expiredCount = records.filter(r => r.reason === 'expired').length;
  if (expiredCount > records.length * 0.3) {
    recommendations.push({
      id: 'rec_1',
      type: 'rotation' as const,
      title: 'Implement FIFO System',
      description: 'High expiry waste detected. Implement First-In-First-Out inventory rotation to reduce expired items.',
      impact: 'high' as const,
      potentialSavings: records.filter(r => r.reason === 'expired').reduce((sum, r) => sum + r.totalCost, 0) * 0.5,
      basedOn: `${expiredCount} items expired this month`,
    });
  }

  const overproductionCount = records.filter(r => r.reason === 'overproduction').length;
  if (overproductionCount > records.length * 0.25) {
    recommendations.push({
      id: 'rec_2',
      type: 'preparation' as const,
      title: 'Adjust Production Quantities',
      description: 'Overproduction is a significant waste source. Consider demand forecasting and smaller batch sizes.',
      impact: 'high' as const,
      potentialSavings: records.filter(r => r.reason === 'overproduction').reduce((sum, r) => sum + r.totalCost, 0) * 0.4,
      basedOn: `${overproductionCount} overproduction incidents this month`,
    });
  }

  if (topWastedItems.length > 0) {
    const topItem = topWastedItems[0];
    recommendations.push({
      id: 'rec_3',
      type: 'menu' as const,
      title: `Review ${topItem.itemName} Usage`,
      description: `${topItem.itemName} is your highest waste item. Consider adjusting portion sizes or finding alternative uses.`,
      impact: 'medium' as const,
      potentialSavings: topItem.totalCost * 0.3,
      basedOn: `${topItem.frequency} waste incidents totaling $${topItem.totalCost.toFixed(2)}`,
    });
  }

  const spoiledCount = records.filter(r => r.reason === 'spoiled').length;
  if (spoiledCount > 5) {
    recommendations.push({
      id: 'rec_4',
      type: 'storage' as const,
      title: 'Improve Storage Conditions',
      description: 'Multiple spoilage incidents suggest storage issues. Check refrigeration temperatures and storage containers.',
      impact: 'medium' as const,
      potentialSavings: records.filter(r => r.reason === 'spoiled').reduce((sum, r) => sum + r.totalCost, 0) * 0.6,
      basedOn: `${spoiledCount} items spoiled this month`,
    });
  }

  return recommendations;
}

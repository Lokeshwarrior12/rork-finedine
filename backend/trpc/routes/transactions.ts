import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { Transaction } from "@/types";

function toRecord<T extends object>(obj: T): Record<string, unknown> {
  return obj as unknown as Record<string, unknown>;
}

export const transactionsRouter = createTRPCRouter({
  getByRestaurant: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.transactions.getByRestaurantId(input.restaurantId);
    }),

  create: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      customerId: z.string(),
      customerName: z.string(),
      couponId: z.string().optional(),
      couponCode: z.string().optional(),
      originalAmount: z.number(),
      discountAmount: z.number(),
      finalAmount: z.number(),
      paymentMethod: z.enum(['cash', 'card', 'upi']),
    }))
    .mutation(async ({ input }) => {
      const transaction: Transaction = {
        id: `trans_${Date.now()}`,
        restaurantId: input.restaurantId,
        customerId: input.customerId,
        customerName: input.customerName,
        couponId: input.couponId,
        couponCode: input.couponCode,
        originalAmount: input.originalAmount,
        discountAmount: input.discountAmount,
        finalAmount: input.finalAmount,
        paymentMethod: input.paymentMethod,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };

      if (input.couponCode) {
        const coupon = await db.coupons.getByCode(input.couponCode);
        if (coupon && coupon.status === 'active') {
          await db.coupons.update(coupon.id, {
            status: 'used',
            usedAt: new Date().toISOString(),
          });
        }
      }

      return db.transactions.create(toRecord(transaction));
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'completed', 'refunded']),
    }))
    .mutation(async ({ input }) => {
      return db.transactions.update(input.id, { status: input.status });
    }),

  getStats: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      period: z.enum(['today', 'week', 'month']).optional(),
    }))
    .query(async ({ input }) => {
      const rawTransactions = await db.transactions.getByRestaurantId(input.restaurantId);
      const transactions = rawTransactions as Transaction[];
      const now = new Date();
      let filteredTransactions = transactions;

      if (input.period === 'today') {
        const today = now.toISOString().split('T')[0];
        filteredTransactions = transactions.filter(t => t.createdAt.startsWith(today));
      } else if (input.period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredTransactions = transactions.filter(t => new Date(t.createdAt) >= weekAgo);
      } else if (input.period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredTransactions = transactions.filter(t => new Date(t.createdAt) >= monthAgo);
      }

      const completed = filteredTransactions.filter(t => t.status === 'completed');

      return {
        total: filteredTransactions.length,
        completed: completed.length,
        totalRevenue: completed.reduce((sum, t) => sum + t.finalAmount, 0),
        totalDiscount: completed.reduce((sum, t) => sum + t.discountAmount, 0),
        averageOrder: completed.length > 0
          ? completed.reduce((sum, t) => sum + t.finalAmount, 0) / completed.length
          : 0,
      };
    }),
});

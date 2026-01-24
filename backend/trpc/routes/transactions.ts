import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { Transaction } from "@/types";

const transactions = new Map<string, Transaction>();

// Generate sample transactions
const sampleTransactions: Transaction[] = [
  {
    id: 'txn_1',
    restaurantId: '1',
    customerId: 'user1',
    customerName: 'John Doe',
    couponId: 'coup_1',
    couponCode: 'FD-ABC123XY',
    originalAmount: 85.00,
    discountAmount: 25.50,
    finalAmount: 59.50,
    paymentMethod: 'card',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'txn_2',
    restaurantId: '1',
    customerId: 'user2',
    customerName: 'Sarah Johnson',
    couponId: 'coup_2',
    couponCode: 'FD-DEF456YZ',
    originalAmount: 120.00,
    discountAmount: 48.00,
    finalAmount: 72.00,
    paymentMethod: 'cash',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'txn_3',
    restaurantId: '1',
    customerId: 'user3',
    customerName: 'Mike Wilson',
    couponId: 'coup_3',
    couponCode: 'FD-GHI789AB',
    originalAmount: 65.00,
    discountAmount: 19.50,
    finalAmount: 45.50,
    paymentMethod: 'upi',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

sampleTransactions.forEach(t => transactions.set(t.id, t));

export const transactionsRouter = createTRPCRouter({
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
    .mutation(({ input }) => {
      const transaction: Transaction = {
        id: `txn_${Date.now()}`,
        ...input,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      
      transactions.set(transaction.id, transaction);
      console.log('Transaction created:', transaction);
      return transaction;
    }),

  getByRestaurant: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(({ input }) => {
      return Array.from(transactions.values())
        .filter(t => t.restaurantId === input.restaurantId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return transactions.get(input.id);
    }),

  getStats: protectedProcedure
    .input(z.object({ 
      restaurantId: z.string(),
      period: z.enum(['daily', 'weekly', 'monthly']).optional(),
    }))
    .query(({ input }) => {
      const restaurantTxns = Array.from(transactions.values())
        .filter(t => t.restaurantId === input.restaurantId && t.status === 'completed');
      
      const now = new Date();
      let filteredTxns = restaurantTxns;
      
      if (input.period === 'daily') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredTxns = restaurantTxns.filter(t => new Date(t.createdAt) >= startOfDay);
      } else if (input.period === 'weekly') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        filteredTxns = restaurantTxns.filter(t => new Date(t.createdAt) >= startOfWeek);
      } else if (input.period === 'monthly') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredTxns = restaurantTxns.filter(t => new Date(t.createdAt) >= startOfMonth);
      }
      
      const totalRevenue = filteredTxns.reduce((sum, t) => sum + t.finalAmount, 0);
      const totalDiscount = filteredTxns.reduce((sum, t) => sum + t.discountAmount, 0);
      const avgOrderValue = filteredTxns.length > 0 ? totalRevenue / filteredTxns.length : 0;
      
      const paymentMethods = {
        cash: filteredTxns.filter(t => t.paymentMethod === 'cash').length,
        card: filteredTxns.filter(t => t.paymentMethod === 'card').length,
        upi: filteredTxns.filter(t => t.paymentMethod === 'upi').length,
      };
      
      return {
        totalTransactions: filteredTxns.length,
        totalRevenue,
        totalDiscount,
        avgOrderValue,
        paymentMethods,
      };
    }),

  refund: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const transaction = transactions.get(input.id);
      if (!transaction) throw new Error('Transaction not found');
      
      const updated = { ...transaction, status: 'refunded' as const };
      transactions.set(input.id, updated);
      return updated;
    }),
});

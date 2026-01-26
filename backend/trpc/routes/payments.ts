import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";

function toRecord<T extends object>(obj: T): Record<string, unknown> {
  return obj as unknown as Record<string, unknown>;
}

interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  stripePaymentIntentId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export const paymentsRouter = createTRPCRouter({
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    return db.payments.getByUserId(ctx.userId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const payments = await db.payments.getAll() as Payment[];
      return payments.find((p: Payment) => p.id === input.id) || null;
    }),

  create: protectedProcedure
    .input(z.object({
      amount: z.number(),
      currency: z.string().default('USD'),
      type: z.enum(['subscription', 'booking', 'service']),
      metadata: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const payment: Payment = {
        id: `pay_${Date.now()}`,
        userId: ctx.userId,
        amount: input.amount,
        currency: input.currency,
        type: input.type,
        status: 'pending',
        metadata: input.metadata,
        createdAt: new Date().toISOString(),
      };

      return db.payments.create(toRecord(payment));
    }),

  processPayment: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      paymentMethodId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const payments = await db.payments.getAll();
      const foundPayment = (payments as Payment[]).find(p => p.id === input.paymentId);
      
      if (!foundPayment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      const updated = await db.payments.update(input.paymentId, {
        status: 'completed',
        stripePaymentIntentId: `pi_${Date.now()}`,
      });

      return updated;
    }),

  refund: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ input }) => {
      return db.payments.update(input.paymentId, { status: 'refunded' });
    }),

  getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const payments = await db.payments.getByUserId(ctx.userId) as Payment[];
    return payments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }),
});

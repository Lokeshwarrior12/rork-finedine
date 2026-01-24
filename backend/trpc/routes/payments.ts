import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { Payment } from "@/backend/db/schema";

export const paymentsRouter = createTRPCRouter({
  createSubscription: protectedProcedure
    .input(z.object({
      amount: z.number(),
      currency: z.string().default('usd'),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('Creating subscription payment:', input.amount, input.currency);
      
      const payment: Payment = {
        id: `pay_${Date.now()}`,
        userId: ctx.userId,
        amount: input.amount,
        currency: input.currency,
        type: 'subscription',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      db.payments.create(payment);
      
      return {
        paymentId: payment.id,
        clientSecret: `mock_secret_${payment.id}`,
        amount: input.amount,
        currency: input.currency,
      };
    }),

  createBookingPayment: protectedProcedure
    .input(z.object({
      bookingId: z.string(),
      amount: z.number(),
      currency: z.string().default('usd'),
      type: z.enum(['booking', 'service']),
    }))
    .mutation(async ({ ctx, input }) => {
      const payment: Payment = {
        id: `pay_${Date.now()}`,
        userId: ctx.userId,
        amount: input.amount,
        currency: input.currency,
        type: input.type,
        status: 'pending',
        metadata: { bookingId: input.bookingId },
        createdAt: new Date().toISOString(),
      };
      
      db.payments.create(payment);
      
      return {
        paymentId: payment.id,
        clientSecret: `mock_secret_${payment.id}`,
        amount: input.amount,
        currency: input.currency,
      };
    }),

  confirmPayment: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      stripePaymentIntentId: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const payment = db.payments.update(input.paymentId, {
        status: 'completed',
        stripePaymentIntentId: input.stripePaymentIntentId,
      });
      
      if (!payment) throw new Error('Payment not found');
      
      return payment;
    }),

  getPaymentHistory: protectedProcedure.query(({ ctx }) => {
    return db.payments.getByUserId(ctx.userId);
  }),

  getPaymentById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const payment = db.payments.getById(input.id);
      if (!payment) throw new Error('Payment not found');
      return payment;
    }),

  refund: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(({ input }) => {
      const payment = db.payments.update(input.paymentId, { status: 'refunded' });
      if (!payment) throw new Error('Payment not found');
      return payment;
    }),
});

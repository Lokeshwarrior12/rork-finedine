import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { Order, OrderStatus, OrderMessage } from "@/types";

export const ordersRouter = createTRPCRouter({
  getByRestaurant: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.orders.getByRestaurantId(input.restaurantId);
    }),

  getByCustomer: protectedProcedure.query(async ({ ctx }) => {
    return db.orders.getByCustomerId(ctx.userId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const order = await db.orders.getById(input.id);
      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }
      return order;
    }),

  create: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      orderType: z.enum(['dinein', 'pickup']),
      items: z.array(z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
        notes: z.string().optional(),
      })),
      tableNumber: z.string().optional(),
      pickupTime: z.string().optional(),
      specialInstructions: z.string().optional(),
      discount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.users.getById(ctx.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const subtotal = input.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discount = input.discount || 0;
      const total = subtotal - discount;

      const order: Order = {
        id: `order_${Date.now()}`,
        restaurantId: input.restaurantId,
        customerId: ctx.userId,
        customerName: user.name,
        customerPhone: user.phone,
        customerPhoto: user.photo,
        orderType: input.orderType,
        items: input.items,
        subtotal,
        discount,
        total,
        status: 'pending',
        tableNumber: input.tableNumber,
        pickupTime: input.pickupTime,
        specialInstructions: input.specialInstructions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };

      const created = await db.orders.create(order);

      await db.notifications.create({
        id: `notif_${Date.now()}`,
        userId: ctx.userId,
        restaurantId: input.restaurantId,
        restaurantName: '',
        title: 'Order Placed',
        message: `Your order #${created.id.slice(-6)} has been placed successfully`,
        type: 'booking',
        read: false,
        createdAt: new Date().toISOString(),
      });

      return created;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled']),
      estimatedTime: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const order = await db.orders.getById(input.id);
      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const updates: Partial<Order> = { status: input.status };
      if (input.estimatedTime) {
        updates.estimatedTime = input.estimatedTime;
      }

      const updated = await db.orders.update(input.id, updates);

      const statusMessages: Record<OrderStatus, string> = {
        pending: 'Order is pending',
        accepted: 'Your order has been accepted',
        preparing: 'Your order is being prepared',
        ready: 'Your order is ready',
        completed: 'Order completed',
        rejected: 'Your order has been rejected',
        cancelled: 'Order cancelled',
      };

      await db.notifications.create({
        id: `notif_${Date.now()}`,
        userId: order.customerId,
        restaurantId: order.restaurantId,
        restaurantName: '',
        title: 'Order Update',
        message: statusMessages[input.status],
        type: 'booking',
        read: false,
        createdAt: new Date().toISOString(),
      });

      return updated;
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      message: z.string(),
      senderType: z.enum(['restaurant', 'customer']),
    }))
    .mutation(async ({ ctx, input }) => {
      const newMessage: OrderMessage = {
        id: `msg_${Date.now()}`,
        orderId: input.orderId,
        senderId: ctx.userId,
        senderType: input.senderType,
        message: input.message,
        timestamp: new Date().toISOString(),
        read: false,
      };

      return db.orders.addMessage(input.orderId, newMessage);
    }),

  markMessageRead: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      messageId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const order = await db.orders.getById(input.orderId);
      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      const messages = order.messages.map(msg =>
        msg.id === input.messageId ? { ...msg, read: true } : msg
      );

      return db.orders.update(input.orderId, { messages });
    }),

  getPendingCount: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const orders = await db.orders.getByRestaurantId(input.restaurantId);
      return orders.filter(o => o.status === 'pending').length;
    }),

  getStats: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const orders = await db.orders.getByRestaurantId(input.restaurantId);
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(o => o.createdAt.startsWith(today));

      return {
        total: orders.length,
        todayCount: todayOrders.length,
        todayRevenue: todayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => ['rejected', 'cancelled'].includes(o.status)).length,
      };
    }),
});

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";

export const notificationsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return db.notifications.getByUserId(ctx.userId);
  }),

  getUnread: protectedProcedure.query(({ ctx }) => {
    return db.notifications.getByUserId(ctx.userId).filter(n => !n.read);
  }),

  getUnreadCount: protectedProcedure.query(({ ctx }) => {
    return db.notifications.getByUserId(ctx.userId).filter(n => !n.read).length;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(({ ctx, input }) => {
      return db.notifications.markAsRead(ctx.userId, input.notificationId);
    }),

  markAllAsRead: protectedProcedure.mutation(({ ctx }) => {
    const notifications = db.notifications.getByUserId(ctx.userId);
    notifications.forEach(n => {
      db.notifications.markAsRead(ctx.userId, n.id);
    });
    return { success: true };
  }),
});

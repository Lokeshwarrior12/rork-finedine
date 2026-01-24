import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";

export const notificationsRouter = createTRPCRouter({
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    return db.notifications.getByUserId(ctx.userId);
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return db.notifications.markAsRead(ctx.userId, input.id);
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const notifications = await db.notifications.getByUserId(ctx.userId);
    for (const notif of notifications) {
      if (!notif.read) {
        await db.notifications.markAsRead(ctx.userId, notif.id);
      }
    }
    return { success: true };
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await db.notifications.getByUserId(ctx.userId);
    return notifications.filter(n => !n.read).length;
  }),
});

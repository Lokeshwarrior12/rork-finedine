import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { TableBooking, ServiceBooking, Service, BookingSlot } from "@/types";

export const bookingsRouter = createTRPCRouter({
  getSlotsByRestaurant: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.bookingSlots.getByRestaurantId(input.restaurantId);
    }),

  getServicesByRestaurant: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.services.getByRestaurantId(input.restaurantId);
    }),

  createTableBooking: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      date: z.string(),
      time: z.string(),
      guests: z.number(),
      tableType: z.string(),
      specialRequests: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.users.getById(ctx.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const booking: TableBooking & { customerName?: string; customerPhone?: string } = {
        id: `tb_${Date.now()}`,
        restaurantId: input.restaurantId,
        userId: ctx.userId,
        customerName: user.name,
        customerPhone: user.phone,
        date: input.date,
        time: input.time,
        guests: input.guests,
        tableType: input.tableType,
        specialRequests: input.specialRequests,
        status: 'pending',
      };

      const created = await db.tableBookings.create(booking as unknown as Record<string, unknown>);

      const restaurant = await db.restaurants.getById(input.restaurantId);
      await db.notifications.create({
        id: `notif_${Date.now()}`,
        userId: ctx.userId,
        restaurantId: input.restaurantId,
        restaurantName: restaurant?.name || '',
        title: 'Booking Request Sent',
        message: `Your table booking request for ${input.date} at ${input.time} has been sent. Waiting for confirmation.`,
        type: 'booking',
        read: false,
        createdAt: new Date().toISOString(),
      });

      return created;
    }),

  createServiceBooking: protectedProcedure
    .input(z.object({
      serviceId: z.string(),
      restaurantId: z.string(),
      date: z.string(),
      timeSlot: z.string(),
      guests: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = await db.services.getById(input.serviceId);
      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      if (input.guests < service.minGuests || input.guests > service.maxGuests) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Guest count must be between ${service.minGuests} and ${service.maxGuests}`,
        });
      }

      const booking: ServiceBooking = {
        id: `sb_${Date.now()}`,
        serviceId: input.serviceId,
        serviceName: service.name,
        restaurantId: input.restaurantId,
        userId: ctx.userId,
        date: input.date,
        timeSlot: input.timeSlot,
        guests: input.guests,
        totalPrice: service.pricePerPerson * input.guests,
        status: 'pending',
      };

      return db.serviceBookings.create(booking as unknown as Record<string, unknown>);
    }),

  getMyTableBookings: protectedProcedure.query(async ({ ctx }) => {
    return db.tableBookings.getByUserId(ctx.userId);
  }),

  getMyServiceBookings: protectedProcedure.query(async ({ ctx }) => {
    return db.serviceBookings.getByUserId(ctx.userId);
  }),

  getRestaurantTableBookings: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.tableBookings.getByRestaurantId(input.restaurantId);
    }),

  getRestaurantServiceBookings: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.serviceBookings.getByRestaurantId(input.restaurantId);
    }),

  updateTableBookingStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'confirmed', 'cancelled']),
      tableNumber: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const booking = await db.tableBookings.getById(input.id);
      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      const updates: Partial<TableBooking> & { tableNumber?: string } = { status: input.status };
      if (input.tableNumber) {
        updates.tableNumber = input.tableNumber;
      }

      const updated = await db.tableBookings.update(input.id, updates);

      const statusMessages: Record<string, string> = {
        confirmed: `Your table booking has been confirmed${input.tableNumber ? `. Table: ${input.tableNumber}` : ''}`,
        cancelled: 'Your table booking has been cancelled',
      };

      if (statusMessages[input.status]) {
        await db.notifications.create({
          id: `notif_${Date.now()}`,
          userId: booking.userId,
          restaurantId: booking.restaurantId,
          restaurantName: '',
          title: input.status === 'confirmed' ? 'Booking Confirmed' : 'Booking Cancelled',
          message: statusMessages[input.status],
          type: 'booking',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      return updated;
    }),

  updateServiceBookingStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'confirmed', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      return db.serviceBookings.update(input.id, { status: input.status });
    }),

  createService: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      name: z.string(),
      pricePerPerson: z.number(),
      minGuests: z.number(),
      maxGuests: z.number(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const service: Service = {
        id: `service_${Date.now()}`,
        restaurantId: input.restaurantId,
        name: input.name,
        pricePerPerson: input.pricePerPerson,
        minGuests: input.minGuests,
        maxGuests: input.maxGuests,
        isActive: true,
        description: input.description,
      };

      return db.services.create(service);
    }),

  updateService: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      pricePerPerson: z.number().optional(),
      minGuests: z.number().optional(),
      maxGuests: z.number().optional(),
      isActive: z.boolean().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.services.update(id, data);
    }),

  deleteService: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.services.delete(input.id);
      return { success: true };
    }),

  createSlot: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      name: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      maxGuests: z.number(),
    }))
    .mutation(async ({ input }) => {
      const slot: BookingSlot = {
        id: `slot_${Date.now()}`,
        restaurantId: input.restaurantId,
        name: input.name,
        startTime: input.startTime,
        endTime: input.endTime,
        maxGuests: input.maxGuests,
      };

      return db.bookingSlots.create(slot);
    }),

  updateSlot: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      maxGuests: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.bookingSlots.update(id, data);
    }),

  deleteSlot: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.bookingSlots.delete(input.id);
      return { success: true };
    }),
});

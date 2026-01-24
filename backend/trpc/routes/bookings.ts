import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { TableBooking, ServiceBooking, Service, BookingSlot } from "@/types";

export const bookingsRouter = createTRPCRouter({
  getSlotsByRestaurant: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(({ input }) => {
      return db.bookingSlots.getByRestaurantId(input.restaurantId);
    }),

  getServicesByRestaurant: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(({ input }) => {
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
    .mutation(({ ctx, input }) => {
      const booking: TableBooking = {
        id: `tb_${Date.now()}`,
        restaurantId: input.restaurantId,
        userId: ctx.userId,
        date: input.date,
        time: input.time,
        guests: input.guests,
        tableType: input.tableType,
        specialRequests: input.specialRequests,
        status: 'pending',
      };
      
      return db.tableBookings.create(booking);
    }),

  createServiceBooking: protectedProcedure
    .input(z.object({
      serviceId: z.string(),
      restaurantId: z.string(),
      date: z.string(),
      timeSlot: z.string(),
      guests: z.number(),
    }))
    .mutation(({ ctx, input }) => {
      const service = db.services.getById(input.serviceId);
      if (!service) throw new Error('Service not found');
      
      if (input.guests < service.minGuests || input.guests > service.maxGuests) {
        throw new Error(`Guest count must be between ${service.minGuests} and ${service.maxGuests}`);
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
      
      return db.serviceBookings.create(booking);
    }),

  getMyTableBookings: protectedProcedure.query(({ ctx }) => {
    return db.tableBookings.getByUserId(ctx.userId);
  }),

  getMyServiceBookings: protectedProcedure.query(({ ctx }) => {
    return db.serviceBookings.getByUserId(ctx.userId);
  }),

  getRestaurantTableBookings: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(({ input }) => {
      return db.tableBookings.getByRestaurantId(input.restaurantId);
    }),

  getRestaurantServiceBookings: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(({ input }) => {
      return db.serviceBookings.getByRestaurantId(input.restaurantId);
    }),

  updateTableBookingStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'confirmed', 'cancelled']),
    }))
    .mutation(({ input }) => {
      return db.tableBookings.update(input.id, { status: input.status });
    }),

  updateServiceBookingStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'confirmed', 'cancelled']),
    }))
    .mutation(({ input }) => {
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
    .mutation(({ input }) => {
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
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.services.update(id, data);
    }),

  deleteService: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      db.services.delete(input.id);
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
    .mutation(({ input }) => {
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
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.bookingSlots.update(id, data);
    }),

  deleteSlot: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      db.bookingSlots.delete(input.id);
      return { success: true };
    }),
});

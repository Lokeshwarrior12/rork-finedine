import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { Employee, WeeklySchedule, Shift } from "@/types";

export const scheduleRouter = createTRPCRouter({
  getEmployees: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.employees.getByRestaurantId(input.restaurantId);
    }),

  createEmployee: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      name: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
      role: z.string(),
      hourlyRate: z.number().optional(),
      availability: z.object({
        monday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        tuesday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        wednesday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        thursday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        friday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        saturday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        sunday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
      }),
    }))
    .mutation(async ({ input }) => {
      const employee: Employee & { restaurantId: string } = {
        id: `emp_${Date.now()}`,
        restaurantId: input.restaurantId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        role: input.role,
        hourlyRate: input.hourlyRate,
        availability: input.availability,
      };

      return db.employees.create(employee as unknown as Record<string, unknown>);
    }),

  updateEmployee: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      role: z.string().optional(),
      hourlyRate: z.number().optional(),
      availability: z.object({
        monday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        tuesday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        wednesday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        thursday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        friday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        saturday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
        sunday: z.object({ available: z.boolean(), startTime: z.string().optional(), endTime: z.string().optional() }),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.employees.update(id, data);
    }),

  deleteEmployee: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.employees.delete(input.id);
      return { success: true };
    }),

  getSchedule: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      weekStartDate: z.string(),
    }))
    .query(async ({ input }) => {
      return db.schedules.getByWeek(input.restaurantId, input.weekStartDate);
    }),

  getSchedules: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      return db.schedules.getByRestaurantId(input.restaurantId);
    }),

  createSchedule: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      weekStartDate: z.string(),
      weekEndDate: z.string(),
      shifts: z.array(z.object({
        id: z.string(),
        employeeId: z.string(),
        employeeName: z.string(),
        date: z.string(),
        dayOfWeek: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        role: z.string(),
        status: z.enum(['scheduled', 'swapRequested', 'completed', 'cancelled']),
        swapRequestedWith: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.schedules.getByWeek(input.restaurantId, input.weekStartDate);
      if (existing) {
        return db.schedules.update(existing.id, { shifts: input.shifts });
      }

      const schedule: WeeklySchedule = {
        id: `schedule_${Date.now()}`,
        restaurantId: input.restaurantId,
        weekStartDate: input.weekStartDate,
        weekEndDate: input.weekEndDate,
        shifts: input.shifts,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return db.schedules.create(schedule as unknown as Record<string, unknown>);
    }),

  updateSchedule: protectedProcedure
    .input(z.object({
      id: z.string(),
      shifts: z.array(z.object({
        id: z.string(),
        employeeId: z.string(),
        employeeName: z.string(),
        date: z.string(),
        dayOfWeek: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        role: z.string(),
        status: z.enum(['scheduled', 'swapRequested', 'completed', 'cancelled']),
        swapRequestedWith: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      return db.schedules.update(input.id, { shifts: input.shifts });
    }),

  addShift: protectedProcedure
    .input(z.object({
      scheduleId: z.string(),
      shift: z.object({
        employeeId: z.string(),
        employeeName: z.string(),
        date: z.string(),
        dayOfWeek: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        role: z.string(),
      }),
    }))
    .mutation(async ({ input }) => {
      const schedules = await db.schedules.getByRestaurantId('');
      const schedule = schedules.find(s => s.id === input.scheduleId);
      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      const newShift: Shift = {
        id: `shift_${Date.now()}`,
        ...input.shift,
        status: 'scheduled',
      };

      return db.schedules.update(input.scheduleId, {
        shifts: [...schedule.shifts, newShift],
      });
    }),

  updateShift: protectedProcedure
    .input(z.object({
      scheduleId: z.string(),
      shiftId: z.string(),
      updates: z.object({
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        status: z.enum(['scheduled', 'swapRequested', 'completed', 'cancelled']).optional(),
        swapRequestedWith: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const schedules = await db.schedules.getByRestaurantId('');
      const schedule = schedules.find(s => s.id === input.scheduleId);
      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      const updatedShifts = schedule.shifts.map(shift =>
        shift.id === input.shiftId
          ? { ...shift, ...input.updates }
          : shift
      );

      return db.schedules.update(input.scheduleId, { shifts: updatedShifts });
    }),

  removeShift: protectedProcedure
    .input(z.object({
      scheduleId: z.string(),
      shiftId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const schedules = await db.schedules.getByRestaurantId('');
      const schedule = schedules.find(s => s.id === input.scheduleId);
      if (!schedule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Schedule not found",
        });
      }

      const updatedShifts = schedule.shifts.filter(shift => shift.id !== input.shiftId);

      return db.schedules.update(input.scheduleId, { shifts: updatedShifts });
    }),
});

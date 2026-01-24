import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { Employee, Shift, WeeklySchedule, WeeklyAvailability } from "@/types";

const employees = new Map<string, Employee>();
const shifts = new Map<string, Shift>();
const schedules = new Map<string, WeeklySchedule>();

const defaultAvailability: WeeklyAvailability = {
  monday: { available: true, startTime: '09:00', endTime: '22:00' },
  tuesday: { available: true, startTime: '09:00', endTime: '22:00' },
  wednesday: { available: true, startTime: '09:00', endTime: '22:00' },
  thursday: { available: true, startTime: '09:00', endTime: '22:00' },
  friday: { available: true, startTime: '09:00', endTime: '22:00' },
  saturday: { available: true, startTime: '09:00', endTime: '22:00' },
  sunday: { available: false },
};

const sampleEmployees: Employee[] = [
  { id: 'emp_1', name: 'John Smith', role: 'Server', availability: defaultAvailability, hourlyRate: 15 },
  { id: 'emp_2', name: 'Sarah Johnson', role: 'Chef', availability: defaultAvailability, hourlyRate: 22 },
  { id: 'emp_3', name: 'Mike Davis', role: 'Bartender', availability: defaultAvailability, hourlyRate: 18 },
];

sampleEmployees.forEach(e => employees.set(e.id, e));

export const scheduleRouter = createTRPCRouter({
  getEmployees: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(() => {
      return Array.from(employees.values());
    }),

  createEmployee: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      name: z.string(),
      role: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
      hourlyRate: z.number().optional(),
    }))
    .mutation(({ input }) => {
      const employee: Employee = {
        id: `emp_${Date.now()}`,
        name: input.name,
        role: input.role,
        phone: input.phone,
        email: input.email,
        hourlyRate: input.hourlyRate,
        availability: defaultAvailability,
      };
      
      employees.set(employee.id, employee);
      return employee;
    }),

  updateEmployee: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      role: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      hourlyRate: z.number().optional(),
      availability: z.any().optional(),
    }))
    .mutation(({ input }) => {
      const employee = employees.get(input.id);
      if (!employee) throw new Error('Employee not found');
      
      const updated = { ...employee, ...input };
      employees.set(input.id, updated);
      return updated;
    }),

  deleteEmployee: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      employees.delete(input.id);
      return { success: true };
    }),

  getShifts: protectedProcedure
    .input(z.object({ 
      restaurantId: z.string(),
      weekStart: z.string(),
    }))
    .query(({ input }) => {
      const weekStart = new Date(input.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      return Array.from(shifts.values()).filter(s => {
        const shiftDate = new Date(s.date);
        return shiftDate >= weekStart && shiftDate < weekEnd;
      });
    }),

  createShift: protectedProcedure
    .input(z.object({
      employeeId: z.string(),
      date: z.string(),
      dayOfWeek: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    }))
    .mutation(({ input }) => {
      const employee = employees.get(input.employeeId);
      if (!employee) throw new Error('Employee not found');
      
      const shift: Shift = {
        id: `shift_${Date.now()}`,
        employeeId: input.employeeId,
        employeeName: employee.name,
        date: input.date,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        role: employee.role,
        status: 'scheduled',
      };
      
      shifts.set(shift.id, shift);
      return shift;
    }),

  updateShift: protectedProcedure
    .input(z.object({
      id: z.string(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      status: z.enum(['scheduled', 'swapRequested', 'completed', 'cancelled']).optional(),
      swapRequestedWith: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const shift = shifts.get(input.id);
      if (!shift) throw new Error('Shift not found');
      
      const updated = { ...shift, ...input };
      shifts.set(input.id, updated);
      return updated;
    }),

  deleteShift: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      shifts.delete(input.id);
      return { success: true };
    }),

  requestSwap: protectedProcedure
    .input(z.object({
      shiftId: z.string(),
      targetEmployeeId: z.string(),
    }))
    .mutation(({ input }) => {
      const shift = shifts.get(input.shiftId);
      if (!shift) throw new Error('Shift not found');
      
      const targetEmployee = employees.get(input.targetEmployeeId);
      if (!targetEmployee) throw new Error('Target employee not found');
      
      const updated: Shift = {
        ...shift,
        status: 'swapRequested',
        swapRequestedWith: targetEmployee.name,
      };
      
      shifts.set(input.shiftId, updated);
      return updated;
    }),

  autoGenerate: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      weekStart: z.string(),
    }))
    .mutation(({ input }) => {
      const weekStart = new Date(input.weekStart);
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const daysFormatted = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const newShifts: Shift[] = [];
      
      Array.from(employees.values()).forEach(employee => {
        days.forEach((day, index) => {
          const availability = employee.availability[day as keyof WeeklyAvailability];
          const date = new Date(weekStart);
          date.setDate(date.getDate() + index);
          const dateStr = date.toISOString().split('T')[0];
          
          const existingShift = Array.from(shifts.values()).find(
            s => s.employeeId === employee.id && s.date === dateStr
          );
          
          if (availability.available && !existingShift) {
            const shift: Shift = {
              id: `shift_${Date.now()}_${employee.id}_${index}`,
              employeeId: employee.id,
              employeeName: employee.name,
              date: dateStr,
              dayOfWeek: daysFormatted[index],
              startTime: availability.startTime || '09:00',
              endTime: availability.endTime || '17:00',
              role: employee.role,
              status: 'scheduled',
            };
            
            shifts.set(shift.id, shift);
            newShifts.push(shift);
          }
        });
      });
      
      return { generatedCount: newShifts.length, shifts: newShifts };
    }),
});

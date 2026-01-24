import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { db } from "@/backend/db";
import { PartnerApplication, CallBooking } from "@/backend/db/schema";

export const verificationRouter = createTRPCRouter({
  sendVerificationCode: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(({ input }) => {
      const code = db.verificationCodes.create(input.email);
      console.log(`Verification code sent to ${input.email}: ${code}`);
      
      return { 
        success: true, 
        message: 'Verification code sent to your email',
      };
    }),

  verifyCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string(),
    }))
    .mutation(({ input }) => {
      const isValid = db.verificationCodes.verify(input.email, input.code);
      
      if (!isValid) {
        throw new Error('Invalid or expired verification code');
      }
      
      return { success: true, verified: true };
    }),

  submitPartnerApplication: publicProcedure
    .input(z.object({
      restaurantName: z.string(),
      ownerName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      address: z.string(),
    }))
    .mutation(({ input }) => {
      const existing = db.partnerApplications.getByEmail(input.email);
      if (existing) {
        throw new Error('Application already submitted with this email');
      }
      
      const application: PartnerApplication = {
        id: `app_${Date.now()}`,
        restaurantName: input.restaurantName,
        ownerName: input.ownerName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      db.partnerApplications.create(application);
      
      const code = db.verificationCodes.create(input.email);
      console.log(`Partner verification code for ${input.email}: ${code}`);
      
      return {
        applicationId: application.id,
        message: 'Application submitted. Verification may take up to 24 hours. A code has been sent to your email.',
      };
    }),

  getApplicationStatus: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(({ input }) => {
      const application = db.partnerApplications.getByEmail(input.email);
      if (!application) {
        throw new Error('No application found with this email');
      }
      
      return {
        status: application.status,
        submittedAt: application.createdAt,
      };
    }),

  bookCall: publicProcedure
    .input(z.object({
      restaurantName: z.string(),
      ownerName: z.string(),
      email: z.string().email(),
      phone: z.string(),
      preferredDate: z.string(),
      preferredTime: z.string(),
    }))
    .mutation(({ input }) => {
      const booking: CallBooking = {
        id: `call_${Date.now()}`,
        restaurantName: input.restaurantName,
        ownerName: input.ownerName,
        email: input.email,
        phone: input.phone,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      db.callBookings.create(booking);
      
      console.log(`Call booked for ${input.ownerName} on ${input.preferredDate} at ${input.preferredTime}`);
      
      return {
        bookingId: booking.id,
        message: 'Call scheduled successfully. Our team will contact you at the scheduled time.',
        scheduledFor: `${input.preferredDate} at ${input.preferredTime}`,
      };
    }),

  getCallBookings: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(({ input }) => {
      return db.callBookings.getAll().filter(c => c.email === input.email);
    }),
});

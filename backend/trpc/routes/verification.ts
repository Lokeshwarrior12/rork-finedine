import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { db } from "@/backend/db";

export const verificationRouter = createTRPCRouter({
  sendCode: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const code = await db.verificationCodes.create(input.email);
      console.log(`Verification code sent to ${input.email}: ${code}`);
      return { success: true, message: "Verification code sent" };
    }),

  verifyCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string(),
    }))
    .mutation(async ({ input }) => {
      const isValid = await db.verificationCodes.verify(input.email, input.code);
      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification code",
        });
      }
      return { success: true, message: "Email verified successfully" };
    }),

  checkEmailExists: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const user = await db.users.getByEmail(input.email);
      return { exists: !!user };
    }),
});

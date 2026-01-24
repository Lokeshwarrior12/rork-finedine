import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { generateToken, hashPassword, verifyPassword } from "@/backend/auth/jwt";
import { User, UserRole } from "@/types";
import { seedSampleUsers } from "@/backend/db/seed";

export const authRouter = createTRPCRouter({
  sendVerificationCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      console.log('Sending verification code to:', input.email);
      
      try {
        const code = await db.verificationCodes.create(input.email);
        console.log(`Verification code for ${input.email}: ${code}`);
        
        return { 
          success: true, 
          message: 'Verification code sent to your email',
          code: process.env.NODE_ENV === 'development' ? code : undefined,
        };
      } catch (error) {
        console.error('Error sending verification code:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification code. Please try again.",
        });
      }
    }),

  verifyCode: publicProcedure
    .input(z.object({
      email: z.string().email(),
      code: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      console.log('Verifying code for:', input.email);
      
      const isValid = await db.verificationCodes.verify(input.email, input.code);
      
      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification code.",
        });
      }
      
      return { success: true, message: 'Email verified successfully' };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['customer', 'restaurant_owner']),
    }))
    .mutation(async ({ input }) => {
      console.log('Login attempt:', input.email, input.role);

      const user = await db.users.getByEmail(input.email);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found. Please sign up first.",
        });
      }

      if (user.role !== input.role) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This account is registered as a ${user.role}. Please select the correct role.`,
        });
      }

      if (!user.passwordHash) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Account configuration error. Please contact support.",
        });
      }

      const isValidPassword = await verifyPassword(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid password. Please try again.",
        });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const { passwordHash, ...safeUser } = user;

      console.log('Login successful:', user.id);
      return { user: safeUser as User, token };
    }),

  signup: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      address: z.string().optional(),
      password: z.string().min(6),
      role: z.enum(['customer', 'restaurant_owner']),
      cuisinePreferences: z.array(z.string()).optional(),
      restaurantId: z.string().optional(),
      verificationCode: z.string().length(6).optional(),
      skipVerification: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('Signup attempt:', input.email, input.role);

      try {
        if (!input.skipVerification && input.verificationCode) {
          const isValid = await db.verificationCodes.verify(input.email, input.verificationCode);
          if (!isValid) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid or expired verification code.",
            });
          }
        }

        const existing = await db.users.getByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists. Please login instead.",
          });
        }

        const passwordHash = await hashPassword(input.password);
        const userId = `user_${Date.now()}`;
        const restaurantId = input.role === 'restaurant_owner' 
          ? (input.restaurantId || `rest_${Date.now()}`)
          : undefined;

        const newUser: User & { passwordHash: string } = {
          id: userId,
          name: input.name,
          email: input.email,
          phone: input.phone || '',
          address: input.address || '',
          role: input.role as UserRole,
          points: 0,
          favorites: [],
          restaurantId,
          cuisinePreferences: input.cuisinePreferences,
          passwordHash,
        };

        await db.users.create(newUser);

        if (input.role === 'restaurant_owner' && restaurantId) {
          await db.restaurants.create({
            id: restaurantId,
            name: `${input.name}'s Restaurant`,
            description: '',
            cuisineType: '',
            address: input.address || '',
            city: '',
            phone: input.phone || '',
            email: input.email,
            rating: 0,
            reviewCount: 0,
            images: [],
            openingHours: '9:00 AM - 10:00 PM',
            waitingTime: '15-20 min',
            categories: [],
            acceptsTableBooking: false,
            ownerId: userId,
          });
        }

        const token = generateToken({
          userId,
          email: input.email,
          role: input.role,
        });

        const { passwordHash: _, ...safeUser } = newUser;

        console.log('Signup successful:', userId);
        return { user: safeUser as User, token };
      } catch (error) {
        console.error('Signup error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account. Please try again.",
        });
      }
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.users.getById(ctx.userId);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    const { passwordHash, ...safeUser } = user as User & { passwordHash?: string };
    return safeUser as User;
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      photo: z.string().optional(),
      cuisinePreferences: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.users.update(ctx.userId, input);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return user;
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.users.getByEmail(ctx.user.email);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const isValidPassword = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const newPasswordHash = await hashPassword(input.newPassword);
      await db.users.update(ctx.userId, { passwordHash: newPasswordHash } as any);

      return { success: true, message: "Password updated successfully" };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.users.getById(ctx.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const newFavorites = user.favorites.includes(input.restaurantId)
        ? user.favorites.filter(id => id !== input.restaurantId)
        : [...user.favorites, input.restaurantId];

      return db.users.update(ctx.userId, { favorites: newFavorites });
    }),

  addPoints: protectedProcedure
    .input(z.object({ points: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.users.getById(ctx.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return db.users.update(ctx.userId, { points: user.points + input.points });
    }),

  updateCardDetails: protectedProcedure
    .input(z.object({
      lastFour: z.string(),
      expiryDate: z.string(),
      cardType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.users.update(ctx.userId, { cardDetails: input });
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await db.users.delete(ctx.userId);
    return { success: true, message: "Account deleted successfully" };
  }),

  verifyToken: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.users.getById(ctx.userId);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    const { passwordHash, ...safeUser } = user as User & { passwordHash?: string };
    return { valid: true, user: safeUser as User };
  }),

  seedDatabase: publicProcedure.mutation(async () => {
    try {
      const result = await seedSampleUsers();
      return result;
    } catch (error) {
      console.error('Seed error:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to seed database",
      });
    }
  }),
});

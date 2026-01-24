import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { User, UserRole } from "@/types";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
      role: z.enum(['customer', 'restaurant_owner']),
    }))
    .mutation(async ({ input }) => {
      console.log('Login attempt:', input.email, input.role);
      
      let user = db.users.getByEmail(input.email);
      
      if (!user) {
        if (input.role === 'customer') {
          user = db.users.create({
            id: `user_${Date.now()}`,
            name: input.email.split('@')[0],
            email: input.email,
            phone: '',
            address: '',
            role: 'customer',
            points: 0,
            favorites: [],
          });
        } else {
          throw new Error('Restaurant owner account not found. Please sign up first.');
        }
      }
      
      return { user, token: user.id };
    }),

  signup: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      address: z.string(),
      password: z.string(),
      role: z.enum(['customer', 'restaurant_owner']),
    }))
    .mutation(async ({ input }) => {
      console.log('Signup attempt:', input.email, input.role);
      
      const existing = db.users.getByEmail(input.email);
      if (existing) {
        throw new Error('Email already registered');
      }
      
      const user: User = {
        id: `user_${Date.now()}`,
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        role: input.role as UserRole,
        points: 0,
        favorites: [],
        restaurantId: input.role === 'restaurant_owner' ? `rest_${Date.now()}` : undefined,
      };
      
      db.users.create(user);
      
      if (input.role === 'restaurant_owner' && user.restaurantId) {
        db.restaurants.create({
          id: user.restaurantId,
          name: `${input.name}'s Restaurant`,
          description: '',
          cuisineType: '',
          address: input.address,
          city: '',
          phone: input.phone,
          email: input.email,
          rating: 0,
          reviewCount: 0,
          images: [],
          openingHours: '9:00 AM - 10:00 PM',
          waitingTime: '15-20 min',
          categories: [],
          acceptsTableBooking: false,
          ownerId: user.id,
        });
      }
      
      return { user, token: user.id };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = db.users.getById(ctx.userId);
    if (!user) throw new Error('User not found');
    return user;
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      photo: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = db.users.update(ctx.userId, input);
      if (!user) throw new Error('User not found');
      return user;
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = db.users.getById(ctx.userId);
      if (!user) throw new Error('User not found');
      
      const newFavorites = user.favorites.includes(input.restaurantId)
        ? user.favorites.filter(id => id !== input.restaurantId)
        : [...user.favorites, input.restaurantId];
      
      return db.users.update(ctx.userId, { favorites: newFavorites });
    }),

  addPoints: protectedProcedure
    .input(z.object({ points: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = db.users.getById(ctx.userId);
      if (!user) throw new Error('User not found');
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
});

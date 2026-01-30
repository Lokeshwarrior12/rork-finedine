import { router, publicProcedure, protectedProcedure, restaurantProcedure } from './trpc';
import { z } from 'zod';
import { db } from '../db';
import bcrypt from 'bcryptjs';

export const appRouter = router({
  health: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }),

  auth: router({
    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
        role: z.enum(['customer', 'restaurant_owner']).default('customer'),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.users.getByEmail(input.email);
        if (existing) {
          throw new Error('User already exists');
        }

        const passwordHash = await bcrypt.hash(input.password, 10);
        const user = await db.users.create({
          email: input.email,
          name: input.name || '',
          role: input.role,
          passwordHash,
          points: 0,
          favorites: [],
        });

        return { success: true, user: { id: user.id, email: user.email, name: user.name } };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.users.getByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials');
        }

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new Error('Invalid credentials');
        }

        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
      }),

    sendVerificationCode: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const code = await db.verificationCodes.create(input.email);
        console.log(`[Auth] Verification code for ${input.email}: ${code}`);
        return { success: true };
      }),

    verifyCode: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string(),
      }))
      .mutation(async ({ input }) => {
        const valid = await db.verificationCodes.verify(input.email, input.code);
        return { success: valid };
      }),
  }),

  restaurants: router({
    list: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        cuisineType: z.string().optional(),
        category: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.restaurants.search(input?.query, input?.cuisineType, input?.category);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return db.restaurants.getById(input.id);
      }),

    getMenu: publicProcedure
      .input(z.object({ restaurantId: z.string() }))
      .query(async ({ input }) => {
        return db.menuItems.getByRestaurantId(input.restaurantId);
      }),
  }),

  orders: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ ctx }) => {
        return db.orders.getByCustomerId(ctx.userId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return db.orders.getById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        restaurantId: z.string(),
        items: z.array(z.object({
          id: z.string(),
          name: z.string(),
          price: z.number(),
          quantity: z.number(),
        })),
        subtotal: z.number(),
        total: z.number(),
        orderType: z.enum(['dinein', 'pickup']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.orders.create({
          userId: ctx.userId,
          restaurantId: input.restaurantId,
          items: input.items,
          subtotal: input.subtotal,
          total: input.total,
          orderType: input.orderType || 'pickup',
          specialInstructions: input.notes,
          status: 'pending',
        });
        return order;
      }),

    updateStatus: restaurantProcedure
      .input(z.object({
        orderId: z.string(),
        status: z.enum(['pending', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled']),
      }))
      .mutation(async ({ input }) => {
        return db.orders.update(input.orderId, { status: input.status });
      }),
  }),

  bookings: router({
    listTable: protectedProcedure.query(async ({ ctx }) => {
      return db.tableBookings.getByUserId(ctx.userId);
    }),

    listService: protectedProcedure.query(async ({ ctx }) => {
      return db.serviceBookings.getByUserId(ctx.userId);
    }),

    createTable: protectedProcedure
      .input(z.object({
        restaurantId: z.string(),
        date: z.string(),
        time: z.string(),
        guests: z.number(),
        tableType: z.string().optional(),
        specialRequests: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.tableBookings.create({
          userId: ctx.userId,
          ...input,
          status: 'pending',
        });
      }),

    createService: protectedProcedure
      .input(z.object({
        restaurantId: z.string(),
        serviceId: z.string(),
        serviceName: z.string(),
        date: z.string(),
        timeSlot: z.string(),
        guests: z.number(),
        totalPrice: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.serviceBookings.create({
          userId: ctx.userId,
          ...input,
          status: 'pending',
        });
      }),
  }),

  deals: router({
    list: publicProcedure.query(async () => {
      return db.deals.getActive();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return db.deals.getById(input.id);
      }),

    claim: protectedProcedure
      .input(z.object({ dealId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const deal = await db.deals.getById(input.dealId);
        if (!deal) throw new Error('Deal not found');

        const couponCode = `${deal.id.slice(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
        
        const coupon = await db.coupons.create({
          dealId: input.dealId,
          userId: ctx.userId,
          dealTitle: deal.title,
          restaurantName: deal.restaurantName,
          restaurantImage: deal.restaurantImage,
          discountPercent: deal.discountPercent,
          status: 'active',
          claimedAt: new Date().toISOString(),
          expiresAt: deal.validTill,
          code: couponCode,
        });

        await db.deals.update(input.dealId, {
          claimedCoupons: (deal.claimedCoupons || 0) + 1,
        });

        return coupon;
      }),
  }),

  coupons: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.coupons.getByUserId(ctx.userId);
    }),

    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const coupon = await db.coupons.getByCode(input.code);
        if (!coupon) return { valid: false, message: 'Coupon not found' };
        if (coupon.status !== 'active') return { valid: false, message: 'Coupon is not active' };
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return { valid: false, message: 'Coupon has expired' };
        }
        return { valid: true, coupon };
      }),

    redeem: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input }) => {
        const coupon = await db.coupons.getByCode(input.code);
        if (!coupon || coupon.status !== 'active') {
          throw new Error('Invalid or already used coupon');
        }
        return db.coupons.update(coupon.id, {
          status: 'used',
          usedAt: new Date().toISOString(),
        });
      }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.users.getById(ctx.userId);
    }),

    update: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        photo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.users.update(ctx.userId, input);
      }),

    toggleFavorite: protectedProcedure
      .input(z.object({ restaurantId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.users.getById(ctx.userId);
        if (!user) throw new Error('User not found');

        const favorites = user.favorites || [];
        const newFavorites = favorites.includes(input.restaurantId)
          ? favorites.filter(id => id !== input.restaurantId)
          : [...favorites, input.restaurantId];

        return db.users.update(ctx.userId, { favorites: newFavorites });
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.notifications.getByUserId(ctx.userId);
    }),

    markRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.notifications.markAsRead(ctx.userId, input.id);
      }),
  }),

  restaurant: router({
    orders: restaurantProcedure.query(async ({ ctx }) => {
      return db.orders.getByRestaurantId(ctx.restaurantId!);
    }),

    tableBookings: restaurantProcedure.query(async ({ ctx }) => {
      return db.tableBookings.getByRestaurantId(ctx.restaurantId!);
    }),

    serviceBookings: restaurantProcedure.query(async ({ ctx }) => {
      return db.serviceBookings.getByRestaurantId(ctx.restaurantId!);
    }),

    inventory: restaurantProcedure.query(async ({ ctx }) => {
      return db.inventory.getByRestaurantId(ctx.restaurantId!);
    }),

    employees: restaurantProcedure.query(async ({ ctx }) => {
      return db.employees.getByRestaurantId(ctx.restaurantId!);
    }),

    deals: restaurantProcedure.query(async ({ ctx }) => {
      return db.deals.getByRestaurantId(ctx.restaurantId!);
    }),

    createDeal: restaurantProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        discountPercent: z.number().min(1).max(100),
        offerType: z.enum(['dinein', 'pickup', 'both']),
        maxCoupons: z.number().optional(),
        minOrder: z.number().optional(),
        validTill: z.string(),
        daysAvailable: z.array(z.string()).optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        termsConditions: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const restaurant = await db.restaurants.getById(ctx.restaurantId!);
        
        return db.deals.create({
          restaurantId: ctx.restaurantId,
          restaurantName: restaurant?.name,
          restaurantImage: restaurant?.logo,
          ...input,
          isActive: true,
          claimedCoupons: 0,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;

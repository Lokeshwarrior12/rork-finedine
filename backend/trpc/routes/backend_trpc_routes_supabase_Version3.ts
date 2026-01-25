import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../create-context';
import { createServerSupabase } from '@/lib/supabase';

let svc;
try {
  svc = createServerSupabase();
} catch (err) {
  svc = null as any;
}

export const supabaseRouter = createTRPCRouter({
  listRestaurants: publicProcedure
    .input(z.object({ q: z.string().optional(), city: z.string().optional(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      if (!svc) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Supabase not configured' });
      const { q, city, limit = 50 } = input;
      let query = svc.from('restaurants').select('*').limit(limit);
      if (city) query = query.eq('city', city);
      if (q) query = query.ilike('name', `%${q}%`);
      const { data, error } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  getMenu: publicProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      if (!svc) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Supabase not configured' });
      const { data, error } = await svc.from('menu_items').select('*').eq('restaurant_id', input.restaurantId);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  createOrder: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      items: z.array(z.object({ menuItemId: z.string(), quantity: z.number().min(1), price: z.number() })),
      deliveryAddress: z.string().optional(),
      phone: z.string().optional(),
      total: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!svc) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Supabase not configured' });
      const userId = ctx.userId;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const payload = {
        user_id: userId,
        restaurant_id: input.restaurantId,
        items: input.items,
        total: input.total,
        delivery_address: input.deliveryAddress ?? null,
        phone: input.phone ?? null,
        status: 'pending',
      };

      const { data, error } = await svc.from('orders').insert([payload]).select().single();
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  signupWithEmail: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional() }))
    .mutation(async ({ input }) => {
      if (!svc) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Supabase not configured' });
      const { data, error } = await svc.auth.admin.createUser({
        email: input.email,
        password: input.password,
        user_metadata: { name: input.name ?? null },
      });
      if (error) throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
      return data;
    }),
});
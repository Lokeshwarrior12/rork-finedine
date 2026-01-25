// backend/db/index.ts
import { createServerSupabase } from '@/lib/supabase';
import { User, Restaurant, Deal, Coupon, Service, BookingSlot, TableBooking, ServiceBooking, Order, FoodWasteRecord, Employee, WeeklySchedule } from '@/types';
import { Notification, CallBooking, Payment as PaymentSchema } from './schema';

const svc = (() => {
  try {
    return createServerSupabase();
  } catch (err) {
    console.warn('Supabase service client not configured (SUPABASE_SERVICE_ROLE_KEY missing)');
    return null as any;
  }
})();

function ensureClient() {
  if (!svc) throw new Error('Supabase service client not configured');
}

async function selectAll(table: string) {
  ensureClient();
  const { data, error } = await svc.from(table).select('*');
  if (error) throw error;
  return data || [];
}

async function selectBy(table: string, field: string, value: unknown) {
  ensureClient();
  const { data, error } = await svc.from(table).select('*').eq(field, value);
  if (error) throw error;
  return data || [];
}

async function selectSingle(table: string, field: string, value: unknown) {
  ensureClient();
  const { data, error } = await svc.from(table).select('*').eq(field, value).maybeSingle();
  if (error) throw error;
  return data || null;
}

async function insertOne(table: string, payload: Record<string, unknown>) {
  ensureClient();
  const { data, error } = await svc.from(table).insert([payload]).select().single();
  if (error) throw error;
  return data;
}

async function updateOne(table: string, id: string, payload: Record<string, unknown>) {
  ensureClient();
  const { data, error } = await svc.from(table).update(payload).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return data || null;
}

async function deleteOne(table: string, id: string) {
  ensureClient();
  const { error } = await svc.from(table).delete().eq('id', id);
  if (error) throw error;
}

export const db = {
  init: async () => {
    // No-op for Supabase - tables are created via migrations
    if (!svc) {
      console.warn('DB init skipped: Supabase service client not configured');
    }
  },

  users: {
    getAll: async (): Promise<User[]> => {
      return selectAll('users');
    },
    getById: async (id: string): Promise<User | null> => {
      return selectSingle('users', 'id', id);
    },
    getByEmail: async (email: string): Promise<User | null> => {
      return selectSingle('users', 'email', email);
    },
    create: async (user: Partial<User>): Promise<User> => {
      return insertOne('users', user as Record<string, unknown>);
    },
    update: async (id: string, data: Partial<User>): Promise<User | null> => {
      return updateOne('users', id, data as Record<string, unknown>);
    },
  },

  restaurants: {
    getAll: async (): Promise<Restaurant[]> => selectAll('restaurants'),
    getById: async (id: string): Promise<Restaurant | null> => selectSingle('restaurants', 'id', id),
    getByOwnerId: async (ownerId: string): Promise<Restaurant[]> => selectBy('restaurants', 'owner_id', ownerId),
    search: async (q?: string, cuisineType?: string, category?: string): Promise<Restaurant[]> => {
      ensureClient();
      let query = svc.from('restaurants').select('*');
      if (q) query = query.ilike('name', `%${q}%`);
      if (cuisineType) query = query.eq('cuisine_type', cuisineType);
      // category is stored as array - use Postgres overlap
      if (category) query = query.contains('categories', [category]);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    create: async (restaurant: Partial<Restaurant>) => insertOne('restaurants', restaurant as Record<string, unknown>),
    update: async (id: string, data: Partial<Restaurant>) => updateOne('restaurants', id, data as Record<string, unknown>),
  },

  menuItems: {
    getByRestaurantId: async (restaurantId: string) => selectBy('menu_items', 'restaurant_id', restaurantId),
    getById: async (id: string) => selectSingle('menu_items', 'id', id),
    create: async (item: Record<string, unknown>) => insertOne('menu_items', item),
    update: async (id: string, data: Record<string, unknown>) => updateOne('menu_items', id, data),
    delete: async (id: string) => deleteOne('menu_items', id),
  },

  orders: {
    create: async (order: Record<string, unknown>) => insertOne('orders', order),
    getById: async (id: string) => selectSingle('orders', 'id', id),
    getByRestaurantId: async (restaurantId: string) => selectBy('orders', 'restaurant_id', restaurantId),
    getByCustomerId: async (customerId: string) => selectBy('orders', 'user_id', customerId),
    getAll: async () => selectAll('orders'),
    update: async (id: string, data: Record<string, unknown>) => updateOne('orders', id, data),
  },

  tableBookings: {
    create: async (b: Record<string, unknown>) => insertOne('bookings', b),
    getByRestaurantId: async (restaurantId: string) => selectBy('bookings', 'restaurant_id', restaurantId),
    update: async (id: string, data: Record<string, unknown>) => updateOne('bookings', id, data),
  },

  serviceBookings: {
    create: async (b: Record<string, unknown>) => insertOne('bookings', b),
    getByRestaurantId: async (restaurantId: string) => selectBy('bookings', 'restaurant_id', restaurantId),
    update: async (id: string, data: Record<string, unknown>) => updateOne('bookings', id, data),
  },

  services: {
    getByRestaurantId: async (restaurantId: string) => selectBy('services', 'restaurant_id', restaurantId),
    getById: async (id: string) => selectSingle('services', 'id', id),
  },

  bookingSlots: {
    getByRestaurantId: async (restaurantId: string) => selectBy('booking_slots', 'restaurant_id', restaurantId),
  },

  payments: {
    create: async (p: Record<string, unknown>) => insertOne('payments', p),
    getByUserId: async (userId: string) => selectBy('payments', 'user_id', userId),
    getAll: async () => selectAll('payments'),
    update: async (id: string, data: Record<string, unknown>) => updateOne('payments', id, data),
  },

  notifications: {
    create: async (n: Record<string, unknown>) => insertOne('notifications', n),
    getByUserId: async (userId: string) => selectBy('notifications', 'user_id', userId),
    markRead: async (id: string) => updateOne('notifications', id, { read: true }),
  },

  verificationCodes: {
    create: async (email: string) => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await insertOne('verification_codes', { email, code, expires_at: expiresAt });
      return code;
    },
    verify: async (email: string, code: string) => {
      ensureClient();
      const { data, error } = await svc.from('verification_codes').select('*').eq('email', email).eq('code', code).maybeSingle();
      if (error) throw error;
      if (!data) return false;
      if (new Date(data.expires_at) < new Date()) return false;
      // Optionally delete or mark used
      await svc.from('verification_codes').delete().eq('id', data.id);
      return true;
    },
  },

  deals: {
    getAll: async () => selectAll('deals'),
    getActive: async () => {
      ensureClient();
      const { data, error } = await svc.from('deals').select('*').eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    getById: async (id: string) => selectSingle('deals', 'id', id),
    getByRestaurantId: async (restaurantId: string) => selectBy('deals', 'restaurant_id', restaurantId),
    create: async (d: Record<string, unknown>) => insertOne('deals', d),
    update: async (id: string, data: Record<string, unknown>) => updateOne('deals', id, data),
  },

  coupons: {
    create: async (c: Record<string, unknown>) => insertOne('coupons', c),
    getByUserId: async (userId: string) => selectBy('coupons', 'user_id', userId),
    getById: async (id: string) => selectSingle('coupons', 'id', id),
    getByCode: async (code: string) => selectSingle('coupons', 'code', code),
    update: async (id: string, data: Record<string, unknown>) => updateOne('coupons', id, data),
  },

  inventory: {
    getByRestaurantId: async (restaurantId: string) => selectBy('inventory', 'restaurant_id', restaurantId),
    getById: async (id: string) => selectSingle('inventory', 'id', id),
    create: async (i: Record<string, unknown>) => insertOne('inventory', i),
    update: async (id: string, data: Record<string, unknown>) => updateOne('inventory', id, data),
    getLowStock: async (restaurantId: string) => {
      ensureClient();
      const { data, error } = await svc.from('inventory').select('*').eq('restaurant_id', restaurantId).lt('quantity', 'min_stock');
      if (error) throw error;
      return data || [];
    },
  },

  foodWaste: {
    create: async (f: Record<string, unknown>) => insertOne('food_waste', f),
    update: async (id: string, data: Record<string, unknown>) => updateOne('food_waste', id, data),
    delete: async (id: string) => deleteOne('food_waste', id),
    getByRestaurantId: async (restaurantId: string) => selectBy('food_waste', 'restaurant_id', restaurantId),
  },

  transactions: {
    create: async (t: Record<string, unknown>) => insertOne('transactions', t),
    getByRestaurantId: async (restaurantId: string) => selectBy('transactions', 'restaurant_id', restaurantId),
    update: async (id: string, data: Record<string, unknown>) => updateOne('transactions', id, data),
  },

  notificationsCreate: async (n: Record<string, unknown>) => insertOne('notifications', n),
};

export default db;
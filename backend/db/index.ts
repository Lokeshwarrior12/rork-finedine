// backend/db/index.ts
import { createServerSupabase } from '@/lib/supabase';
import { User, Restaurant, Deal, Coupon, Service, BookingSlot, TableBooking, ServiceBooking, Order, FoodWasteRecord, Employee, WeeklySchedule } from '@/types';
import { Notification, CallBooking } from './schema';

export interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier?: string;
  expiryDate?: string;
  lastRestocked?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel?: number;
  preparationTime?: number;
}

const svc = (() => {
  try {
    return createServerSupabase();
  } catch (err) {
    console.warn('Supabase service client not configured:', err);
    return null as any;
  }
})();

function ensureClient() {
  if (!svc) throw new Error('Supabase service client not configured');
}

function snakeToCamel(obj: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!obj) return null;
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

function transformArray<T>(data: unknown[] | null): T[] {
  if (!data) return [];
  return data.map(item => snakeToCamel(item as Record<string, unknown>) as unknown as T);
}

async function selectAll<T>(table: string): Promise<T[]> {
  ensureClient();
  const { data, error } = await svc.from(table).select('*');
  if (error) throw error;
  return transformArray<T>(data);
}

async function selectBy<T>(table: string, field: string, value: unknown): Promise<T[]> {
  ensureClient();
  const snakeField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  const { data, error } = await svc.from(table).select('*').eq(snakeField, value);
  if (error) throw error;
  return transformArray<T>(data);
}

async function selectSingle<T>(table: string, field: string, value: unknown): Promise<T | null> {
  ensureClient();
  const snakeField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  const { data, error } = await svc.from(table).select('*').eq(snakeField, value).maybeSingle();
  if (error) throw error;
  return snakeToCamel(data) as T | null;
}

async function insertOne<T>(table: string, payload: Record<string, unknown>): Promise<T> {
  ensureClient();
  const snakePayload = camelToSnake(payload);
  const { data, error } = await svc.from(table).insert([snakePayload]).select().single();
  if (error) throw error;
  return snakeToCamel(data) as T;
}

async function updateOne<T>(table: string, id: string, payload: Record<string, unknown>): Promise<T | null> {
  ensureClient();
  const snakePayload = camelToSnake(payload);
  const { data, error } = await svc.from(table).update(snakePayload).eq('id', id).select().maybeSingle();
  if (error) throw error;
  return snakeToCamel(data) as T | null;
}

async function deleteOne(table: string, id: string): Promise<void> {
  ensureClient();
  const { error } = await svc.from(table).delete().eq('id', id);
  if (error) throw error;
}

export const db = {
  init: async () => {
    if (!svc) {
      console.warn('DB init skipped: Supabase service client not configured');
    }
  },

  users: {
    getAll: async (): Promise<User[]> => selectAll<User>('users'),
    getById: async (id: string): Promise<User | null> => selectSingle<User>('users', 'id', id),
    getByEmail: async (email: string): Promise<(User & { passwordHash?: string }) | null> => {
      ensureClient();
      const { data, error } = await svc.from('users').select('*').eq('email', email).maybeSingle();
      if (error) throw error;
      return snakeToCamel(data) as (User & { passwordHash?: string }) | null;
    },
    create: async (user: Partial<User> & { passwordHash?: string }): Promise<User> => {
      return insertOne<User>('users', user as Record<string, unknown>);
    },
    update: async (id: string, data: Partial<User> & { passwordHash?: string }): Promise<User | null> => {
      return updateOne<User>('users', id, data as Record<string, unknown>);
    },
    delete: async (id: string): Promise<void> => deleteOne('users', id),
  },

  restaurants: {
    getAll: async (): Promise<Restaurant[]> => selectAll<Restaurant>('restaurants'),
    getById: async (id: string): Promise<Restaurant | null> => selectSingle<Restaurant>('restaurants', 'id', id),
    getByOwnerId: async (ownerId: string): Promise<Restaurant[]> => selectBy<Restaurant>('restaurants', 'ownerId', ownerId),
    search: async (q?: string, cuisineType?: string, category?: string): Promise<Restaurant[]> => {
      ensureClient();
      let query = svc.from('restaurants').select('*');
      if (q) query = query.ilike('name', `%${q}%`);
      if (cuisineType) query = query.eq('cuisine_type', cuisineType);
      if (category) query = query.contains('categories', [category]);
      const { data, error } = await query;
      if (error) throw error;
      return transformArray<Restaurant>(data);
    },
    create: async (restaurant: Partial<Restaurant>) => insertOne<Restaurant>('restaurants', restaurant as Record<string, unknown>),
    update: async (id: string, data: Partial<Restaurant>) => updateOne<Restaurant>('restaurants', id, data as Record<string, unknown>),
  },

  menuItems: {
    getByRestaurantId: async (restaurantId: string) => selectBy('menu_items', 'restaurantId', restaurantId),
    getById: async (id: string) => selectSingle('menu_items', 'id', id),
    create: async (item: Record<string, unknown>) => insertOne('menu_items', item),
    update: async (id: string, data: Record<string, unknown>) => updateOne('menu_items', id, data),
    delete: async (id: string) => deleteOne('menu_items', id),
  },

  orders: {
    create: async (order: Record<string, unknown>): Promise<Order> => insertOne<Order>('orders', order),
    getById: async (id: string): Promise<Order | null> => selectSingle<Order>('orders', 'id', id),
    getByRestaurantId: async (restaurantId: string): Promise<Order[]> => selectBy<Order>('orders', 'restaurantId', restaurantId),
    getByCustomerId: async (customerId: string): Promise<Order[]> => {
      ensureClient();
      const { data, error } = await svc.from('orders').select('*').eq('user_id', customerId);
      if (error) throw error;
      return transformArray<Order>(data);
    },
    getAll: async (): Promise<Order[]> => selectAll<Order>('orders'),
    update: async (id: string, data: Record<string, unknown>): Promise<Order | null> => updateOne<Order>('orders', id, data),
    addMessage: async (orderId: string, message: Record<string, unknown>): Promise<Order | null> => {
      ensureClient();
      const order = await selectSingle<Order>('orders', 'id', orderId);
      if (!order) return null;
      const messages = [...(order.messages || []), message];
      return updateOne<Order>('orders', orderId, { messages });
    },
  },

  tableBookings: {
    create: async (b: Record<string, unknown>): Promise<TableBooking> => {
      const payload = { ...b, type: 'table' };
      return insertOne<TableBooking>('bookings', payload);
    },
    getByRestaurantId: async (restaurantId: string): Promise<TableBooking[]> => {
      ensureClient();
      const { data, error } = await svc.from('bookings').select('*').eq('restaurant_id', restaurantId).eq('type', 'table');
      if (error) throw error;
      return transformArray<TableBooking>(data);
    },
    getByUserId: async (userId: string): Promise<TableBooking[]> => {
      ensureClient();
      const { data, error } = await svc.from('bookings').select('*').eq('user_id', userId).eq('type', 'table');
      if (error) throw error;
      return transformArray<TableBooking>(data);
    },
    getById: async (id: string): Promise<TableBooking | null> => selectSingle<TableBooking>('bookings', 'id', id),
    update: async (id: string, data: Record<string, unknown>): Promise<TableBooking | null> => updateOne<TableBooking>('bookings', id, data),
  },

  serviceBookings: {
    create: async (b: Record<string, unknown>): Promise<ServiceBooking> => {
      const payload = { ...b, type: 'service' };
      return insertOne<ServiceBooking>('bookings', payload);
    },
    getByRestaurantId: async (restaurantId: string): Promise<ServiceBooking[]> => {
      ensureClient();
      const { data, error } = await svc.from('bookings').select('*').eq('restaurant_id', restaurantId).eq('type', 'service');
      if (error) throw error;
      return transformArray<ServiceBooking>(data);
    },
    getByUserId: async (userId: string): Promise<ServiceBooking[]> => {
      ensureClient();
      const { data, error } = await svc.from('bookings').select('*').eq('user_id', userId).eq('type', 'service');
      if (error) throw error;
      return transformArray<ServiceBooking>(data);
    },
    update: async (id: string, data: Record<string, unknown>): Promise<ServiceBooking | null> => updateOne<ServiceBooking>('bookings', id, data),
  },

  services: {
    getByRestaurantId: async (restaurantId: string): Promise<Service[]> => selectBy<Service>('services', 'restaurantId', restaurantId),
    getById: async (id: string): Promise<Service | null> => selectSingle<Service>('services', 'id', id),
    create: async (service: Partial<Service>): Promise<Service> => insertOne<Service>('services', service as Record<string, unknown>),
    update: async (id: string, data: Partial<Service>): Promise<Service | null> => updateOne<Service>('services', id, data as Record<string, unknown>),
    delete: async (id: string): Promise<void> => deleteOne('services', id),
  },

  bookingSlots: {
    getByRestaurantId: async (restaurantId: string): Promise<BookingSlot[]> => selectBy<BookingSlot>('booking_slots', 'restaurantId', restaurantId),
    getById: async (id: string): Promise<BookingSlot | null> => selectSingle<BookingSlot>('booking_slots', 'id', id),
    create: async (slot: Partial<BookingSlot>): Promise<BookingSlot> => insertOne<BookingSlot>('booking_slots', slot as Record<string, unknown>),
    update: async (id: string, data: Partial<BookingSlot>): Promise<BookingSlot | null> => updateOne<BookingSlot>('booking_slots', id, data as Record<string, unknown>),
    delete: async (id: string): Promise<void> => deleteOne('booking_slots', id),
  },

  payments: {
    create: async (p: Record<string, unknown>) => insertOne('payments', p),
    getByUserId: async (userId: string) => selectBy('payments', 'userId', userId),
    getAll: async () => selectAll('payments'),
    update: async (id: string, data: Record<string, unknown>) => updateOne('payments', id, data),
  },

  notifications: {
    create: async (n: Record<string, unknown>): Promise<Notification> => insertOne<Notification>('notifications', n),
    getByUserId: async (userId: string): Promise<Notification[]> => selectBy<Notification>('notifications', 'userId', userId),
    markRead: async (id: string): Promise<Notification | null> => updateOne<Notification>('notifications', id, { read: true }),
    markAsRead: async (userId: string, id: string): Promise<Notification | null> => updateOne<Notification>('notifications', id, { read: true }),
    notifyFavorites: async (restaurantId: string, offerTitle: string): Promise<void> => {
      ensureClient();
      const { data: users, error } = await svc.from('users').select('id, favorites');
      if (error) {
        console.error('Error fetching users for notification:', error);
        return;
      }
      
      const usersToNotify = (users || []).filter((u: any) => 
        u.favorites && Array.isArray(u.favorites) && u.favorites.includes(restaurantId)
      );
      
      for (const user of usersToNotify) {
        try {
          await insertOne('notifications', {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            restaurantId,
            restaurantName: '',
            title: 'New Offer Available!',
            message: `Check out the new offer: ${offerTitle}`,
            type: 'offer',
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error creating notification:', err);
        }
      }
    },
  },

  verificationCodes: {
    create: async (email: string): Promise<string> => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await insertOne('verification_codes', { email, code, expiresAt });
      return code;
    },
    verify: async (email: string, code: string): Promise<boolean> => {
      ensureClient();
      const { data, error } = await svc.from('verification_codes').select('*').eq('email', email).eq('code', code).maybeSingle();
      if (error) throw error;
      if (!data) return false;
      if (new Date(data.expires_at) < new Date()) return false;
      await svc.from('verification_codes').delete().eq('id', data.id);
      return true;
    },
  },

  deals: {
    getAll: async (): Promise<Deal[]> => selectAll<Deal>('deals'),
    getActive: async (): Promise<Deal[]> => {
      ensureClient();
      const { data, error } = await svc.from('deals').select('*').eq('is_active', true);
      if (error) throw error;
      return transformArray<Deal>(data);
    },
    getById: async (id: string): Promise<Deal | null> => selectSingle<Deal>('deals', 'id', id),
    getByRestaurantId: async (restaurantId: string): Promise<Deal[]> => selectBy<Deal>('deals', 'restaurantId', restaurantId),
    create: async (d: Record<string, unknown>): Promise<Deal> => insertOne<Deal>('deals', d),
    update: async (id: string, data: Record<string, unknown>): Promise<Deal | null> => updateOne<Deal>('deals', id, data),
    delete: async (id: string): Promise<void> => deleteOne('deals', id),
  },

  coupons: {
    create: async (c: Record<string, unknown>): Promise<Coupon> => insertOne<Coupon>('coupons', c),
    getAll: async (): Promise<Coupon[]> => selectAll<Coupon>('coupons'),
    getByUserId: async (userId: string): Promise<Coupon[]> => selectBy<Coupon>('coupons', 'userId', userId),
    getById: async (id: string): Promise<Coupon | null> => selectSingle<Coupon>('coupons', 'id', id),
    getByCode: async (code: string): Promise<Coupon | null> => selectSingle<Coupon>('coupons', 'code', code),
    update: async (id: string, data: Record<string, unknown>): Promise<Coupon | null> => updateOne<Coupon>('coupons', id, data),
  },

  inventory: {
    getByRestaurantId: async (restaurantId: string): Promise<InventoryItem[]> => selectBy<InventoryItem>('inventory', 'restaurantId', restaurantId),
    getById: async (id: string): Promise<InventoryItem | null> => selectSingle<InventoryItem>('inventory', 'id', id),
    create: async (i: Record<string, unknown>): Promise<InventoryItem> => insertOne<InventoryItem>('inventory', i),
    update: async (id: string, data: Record<string, unknown>): Promise<InventoryItem | null> => updateOne<InventoryItem>('inventory', id, data),
    delete: async (id: string): Promise<void> => deleteOne('inventory', id),
    getLowStock: async (restaurantId: string): Promise<InventoryItem[]> => {
      ensureClient();
      const { data, error } = await svc
        .from('inventory')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .lte('quantity', svc.rpc ? undefined : 10);
      if (error) throw error;
      const items = transformArray<InventoryItem>(data);
      return items.filter(i => i.quantity <= i.minStock);
    },
  },

  foodWaste: {
    create: async (f: Record<string, unknown>): Promise<FoodWasteRecord> => insertOne<FoodWasteRecord>('food_waste', f),
    update: async (id: string, data: Record<string, unknown>): Promise<FoodWasteRecord | null> => updateOne<FoodWasteRecord>('food_waste', id, data),
    delete: async (id: string): Promise<void> => deleteOne('food_waste', id),
    getByRestaurantId: async (restaurantId: string): Promise<FoodWasteRecord[]> => selectBy<FoodWasteRecord>('food_waste', 'restaurantId', restaurantId),
    getById: async (id: string): Promise<FoodWasteRecord | null> => selectSingle<FoodWasteRecord>('food_waste', 'id', id),
    getByDateRange: async (restaurantId: string, startDate: string, endDate: string): Promise<FoodWasteRecord[]> => {
      ensureClient();
      const { data, error } = await svc
        .from('food_waste')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      return transformArray<FoodWasteRecord>(data);
    },
  },

  transactions: {
    create: async (t: Record<string, unknown>) => insertOne('transactions', t),
    getByRestaurantId: async (restaurantId: string) => selectBy('transactions', 'restaurantId', restaurantId),
    update: async (id: string, data: Record<string, unknown>) => updateOne('transactions', id, data),
  },

  schedules: {
    getByRestaurantId: async (restaurantId: string): Promise<WeeklySchedule[]> => selectBy<WeeklySchedule>('schedules', 'restaurantId', restaurantId),
    getById: async (id: string): Promise<WeeklySchedule | null> => selectSingle<WeeklySchedule>('schedules', 'id', id),
    getByWeek: async (restaurantId: string, weekStartDate: string): Promise<WeeklySchedule | null> => {
      ensureClient();
      const { data, error } = await svc
        .from('schedules')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();
      if (error) throw error;
      return snakeToCamel(data) as WeeklySchedule | null;
    },
    create: async (s: Record<string, unknown>): Promise<WeeklySchedule> => insertOne<WeeklySchedule>('schedules', s),
    update: async (id: string, data: Record<string, unknown>): Promise<WeeklySchedule | null> => updateOne<WeeklySchedule>('schedules', id, data),
    delete: async (id: string): Promise<void> => deleteOne('schedules', id),
  },

  employees: {
    getByRestaurantId: async (restaurantId: string): Promise<Employee[]> => selectBy<Employee>('employees', 'restaurantId', restaurantId),
    getById: async (id: string): Promise<Employee | null> => selectSingle<Employee>('employees', 'id', id),
    create: async (e: Record<string, unknown>): Promise<Employee> => insertOne<Employee>('employees', e),
    update: async (id: string, data: Record<string, unknown>): Promise<Employee | null> => updateOne<Employee>('employees', id, data),
    delete: async (id: string): Promise<void> => deleteOne('employees', id),
  },

  callBookings: {
    create: async (c: Record<string, unknown>): Promise<CallBooking> => insertOne<CallBooking>('call_bookings', c),
    getById: async (id: string): Promise<CallBooking | null> => selectSingle<CallBooking>('call_bookings', 'id', id),
    update: async (id: string, data: Record<string, unknown>): Promise<CallBooking | null> => updateOne<CallBooking>('call_bookings', id, data),
  },

  notificationsCreate: async (n: Record<string, unknown>) => insertOne('notifications', n),
};

export default db;

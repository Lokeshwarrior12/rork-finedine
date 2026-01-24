import { getDB, extractId, initializeDatabase } from './surreal-client';
import { User, Restaurant, Deal, Coupon, Service, BookingSlot, TableBooking, ServiceBooking, Order, FoodWasteRecord, Employee, WeeklySchedule } from '@/types';
import { Notification, CallBooking, Payment } from './schema';

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

let dbInitialized = false;

async function ensureDBInitialized() {
  if (!dbInitialized) {
    try {
      await initializeDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
}

type DBRecord = Record<string, unknown> & { id: string | { id: string } };

function mapResults<T>(results: unknown): T[] {
  if (!results) return [];
  if (!Array.isArray(results)) return [{ ...results, id: extractId(results as DBRecord) }] as T[];
  return results.map((r: DBRecord) => ({ ...r, id: extractId(r) })) as T[];
}

function mapSingleResult<T>(result: unknown, id: string): T | null {
  if (!result) return null;
  if (Array.isArray(result)) {
    if (result.length === 0) return null;
    return { ...result[0], id: extractId(result[0] as DBRecord) } as T;
  }
  return { ...result, id } as T;
}

export const db = {
  init: async () => {
    await ensureDBInitialized();
  },

  users: {
    getAll: async (): Promise<User[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('users');
      return mapResults<User>(result);
    },
    getById: async (id: string): Promise<User | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`users:${id}`);
      return mapSingleResult<User>(result, id);
    },
    getByEmail: async (email: string): Promise<(User & { passwordHash?: string }) | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM users WHERE email = $email LIMIT 1',
        { email }
      );
      const records = (result as unknown[][])[0] || [];
      if (records.length > 0) {
        const user = records[0] as DBRecord;
        return { ...user, id: extractId(user) } as User & { passwordHash?: string };
      }
      return null;
    },
    create: async (user: User & { passwordHash: string }): Promise<User> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = user.id || `user_${Date.now()}`;
      await database.create(`users:${id}`, {
        ...user,
        id: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { ...user, id };
    },
    update: async (id: string, data: Partial<User & { passwordHash?: string }>): Promise<User | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`users:${id}`, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      if (result) {
        return { ...(result as object), id } as User;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`users:${id}`);
      return true;
    },
  },

  restaurants: {
    getAll: async (): Promise<Restaurant[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('restaurants');
      return mapResults<Restaurant>(result);
    },
    getById: async (id: string): Promise<Restaurant | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`restaurants:${id}`);
      return mapSingleResult<Restaurant>(result, id);
    },
    getByOwnerId: async (ownerId: string): Promise<Restaurant | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM restaurants WHERE ownerId = $ownerId LIMIT 1',
        { ownerId }
      );
      const records = (result as unknown[][])[0] || [];
      if (records.length > 0) {
        const restaurant = records[0] as DBRecord;
        return { ...restaurant, id: extractId(restaurant) } as Restaurant;
      }
      return null;
    },
    create: async (restaurant: Restaurant): Promise<Restaurant> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = restaurant.id || `rest_${Date.now()}`;
      await database.create(`restaurants:${id}`, {
        ...restaurant,
        id: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { ...restaurant, id };
    },
    update: async (id: string, data: Partial<Restaurant>): Promise<Restaurant | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`restaurants:${id}`, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      if (result) {
        return { ...(result as object), id } as Restaurant;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`restaurants:${id}`);
      return true;
    },
    search: async (query?: string, cuisineType?: string, category?: string): Promise<Restaurant[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      let sql = 'SELECT * FROM restaurants WHERE true';
      const params: Record<string, string> = {};

      if (query) {
        sql += ' AND (name CONTAINS $query OR description CONTAINS $query OR cuisineType CONTAINS $query)';
        params.query = query.toLowerCase();
      }
      if (cuisineType) {
        sql += ' AND cuisineType = $cuisineType';
        params.cuisineType = cuisineType;
      }
      if (category) {
        sql += ' AND $category IN categories';
        params.category = category;
      }

      const result = await database.query(sql, params);
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Restaurant[];
    },
  },

  deals: {
    getAll: async (): Promise<Deal[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('deals');
      return mapResults<Deal>(result);
    },
    getById: async (id: string): Promise<Deal | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`deals:${id}`);
      return mapSingleResult<Deal>(result, id);
    },
    getByRestaurantId: async (restaurantId: string): Promise<Deal[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM deals WHERE restaurantId = $restaurantId',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Deal[];
    },
    getActive: async (): Promise<Deal[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query('SELECT * FROM deals WHERE isActive = true');
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Deal[];
    },
    create: async (deal: Deal): Promise<Deal> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = deal.id || `deal_${Date.now()}`;
      await database.create(`deals:${id}`, {
        ...deal,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...deal, id };
    },
    update: async (id: string, data: Partial<Deal>): Promise<Deal | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`deals:${id}`, data);
      if (result) {
        return { ...(result as object), id } as Deal;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`deals:${id}`);
      return true;
    },
  },

  coupons: {
    getAll: async (): Promise<Coupon[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('coupons');
      return mapResults<Coupon>(result);
    },
    getById: async (id: string): Promise<Coupon | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`coupons:${id}`);
      return mapSingleResult<Coupon>(result, id);
    },
    getByUserId: async (userId: string): Promise<Coupon[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM coupons WHERE userId = $userId',
        { userId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Coupon[];
    },
    getByCode: async (code: string): Promise<Coupon | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM coupons WHERE code = $code LIMIT 1',
        { code }
      );
      const records = (result as unknown[][])[0] || [];
      if (records.length > 0) {
        const coupon = records[0] as DBRecord;
        return { ...coupon, id: extractId(coupon) } as Coupon;
      }
      return null;
    },
    create: async (coupon: Coupon & { userId: string }): Promise<Coupon> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = coupon.id || `coupon_${Date.now()}`;
      await database.create(`coupons:${id}`, {
        ...coupon,
        id: undefined,
      });
      return { ...coupon, id };
    },
    update: async (id: string, data: Partial<Coupon>): Promise<Coupon | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`coupons:${id}`, data);
      if (result) {
        return { ...(result as object), id } as Coupon;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`coupons:${id}`);
      return true;
    },
  },

  services: {
    getAll: async (): Promise<Service[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('services');
      return mapResults<Service>(result);
    },
    getById: async (id: string): Promise<Service | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`services:${id}`);
      return mapSingleResult<Service>(result, id);
    },
    getByRestaurantId: async (restaurantId: string): Promise<Service[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM services WHERE restaurantId = $restaurantId',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Service[];
    },
    create: async (service: Service): Promise<Service> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = service.id || `service_${Date.now()}`;
      await database.create(`services:${id}`, {
        ...service,
        id: undefined,
      });
      return { ...service, id };
    },
    update: async (id: string, data: Partial<Service>): Promise<Service | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`services:${id}`, data);
      if (result) {
        return { ...(result as object), id } as Service;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`services:${id}`);
      return true;
    },
  },

  bookingSlots: {
    getAll: async (): Promise<BookingSlot[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('bookingSlots');
      return mapResults<BookingSlot>(result);
    },
    getById: async (id: string): Promise<BookingSlot | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`bookingSlots:${id}`);
      return mapSingleResult<BookingSlot>(result, id);
    },
    getByRestaurantId: async (restaurantId: string): Promise<BookingSlot[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM bookingSlots WHERE restaurantId = $restaurantId',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as BookingSlot[];
    },
    create: async (slot: BookingSlot): Promise<BookingSlot> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = slot.id || `slot_${Date.now()}`;
      await database.create(`bookingSlots:${id}`, {
        ...slot,
        id: undefined,
      });
      return { ...slot, id };
    },
    update: async (id: string, data: Partial<BookingSlot>): Promise<BookingSlot | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`bookingSlots:${id}`, data);
      if (result) {
        return { ...(result as object), id } as BookingSlot;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`bookingSlots:${id}`);
      return true;
    },
  },

  tableBookings: {
    getAll: async (): Promise<TableBooking[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('tableBookings');
      return mapResults<TableBooking>(result);
    },
    getById: async (id: string): Promise<TableBooking | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`tableBookings:${id}`);
      return mapSingleResult<TableBooking>(result, id);
    },
    getByUserId: async (userId: string): Promise<TableBooking[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM tableBookings WHERE userId = $userId ORDER BY createdAt DESC',
        { userId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as TableBooking[];
    },
    getByRestaurantId: async (restaurantId: string): Promise<TableBooking[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM tableBookings WHERE restaurantId = $restaurantId ORDER BY createdAt DESC',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as TableBooking[];
    },
    create: async (booking: TableBooking & { customerName?: string; customerPhone?: string }): Promise<TableBooking> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = booking.id || `tb_${Date.now()}`;
      await database.create(`tableBookings:${id}`, {
        ...booking,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...booking, id };
    },
    update: async (id: string, data: Partial<TableBooking>): Promise<TableBooking | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`tableBookings:${id}`, data);
      if (result) {
        return { ...(result as object), id } as TableBooking;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`tableBookings:${id}`);
      return true;
    },
  },

  serviceBookings: {
    getAll: async (): Promise<ServiceBooking[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('serviceBookings');
      return mapResults<ServiceBooking>(result);
    },
    getById: async (id: string): Promise<ServiceBooking | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`serviceBookings:${id}`);
      return mapSingleResult<ServiceBooking>(result, id);
    },
    getByUserId: async (userId: string): Promise<ServiceBooking[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM serviceBookings WHERE userId = $userId ORDER BY createdAt DESC',
        { userId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as ServiceBooking[];
    },
    getByRestaurantId: async (restaurantId: string): Promise<ServiceBooking[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM serviceBookings WHERE restaurantId = $restaurantId ORDER BY createdAt DESC',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as ServiceBooking[];
    },
    create: async (booking: ServiceBooking): Promise<ServiceBooking> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = booking.id || `sb_${Date.now()}`;
      await database.create(`serviceBookings:${id}`, {
        ...booking,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...booking, id };
    },
    update: async (id: string, data: Partial<ServiceBooking>): Promise<ServiceBooking | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`serviceBookings:${id}`, data);
      if (result) {
        return { ...(result as object), id } as ServiceBooking;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`serviceBookings:${id}`);
      return true;
    },
  },

  notifications: {
    getByUserId: async (userId: string): Promise<Notification[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM notifications WHERE userId = $userId ORDER BY createdAt DESC',
        { userId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Notification[];
    },
    create: async (notification: Notification): Promise<Notification> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = notification.id || `notif_${Date.now()}`;
      await database.create(`notifications:${id}`, {
        ...notification,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...notification, id };
    },
    markAsRead: async (userId: string, notificationId: string): Promise<Notification | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`notifications:${notificationId}`, { read: true });
      if (result) {
        return { ...(result as object), id: notificationId } as Notification;
      }
      return null;
    },
    notifyFavorites: async (restaurantId: string, dealTitle: string): Promise<void> => {
      await ensureDBInitialized();
      const database = await getDB();
      const restaurant = await db.restaurants.getById(restaurantId);
      if (!restaurant) return;

      const result = await database.query(
        'SELECT * FROM users WHERE $restaurantId IN favorites',
        { restaurantId }
      );

      const users = (result as unknown[][])[0] || [];
      for (const user of users) {
        const userId = extractId(user as DBRecord);
        await db.notifications.create({
          id: `notif_${Date.now()}_${userId}`,
          userId,
          restaurantId,
          restaurantName: restaurant.name,
          title: 'New Offer!',
          message: `${restaurant.name} just launched: ${dealTitle}`,
          type: 'offer',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    },
  },

  orders: {
    getAll: async (): Promise<Order[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('orders');
      return mapResults<Order>(result);
    },
    getById: async (id: string): Promise<Order | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`orders:${id}`);
      return mapSingleResult<Order>(result, id);
    },
    getByRestaurantId: async (restaurantId: string): Promise<Order[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM orders WHERE restaurantId = $restaurantId ORDER BY createdAt DESC',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Order[];
    },
    getByCustomerId: async (customerId: string): Promise<Order[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM orders WHERE customerId = $customerId ORDER BY createdAt DESC',
        { customerId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Order[];
    },
    create: async (order: Order): Promise<Order> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = order.id || `order_${Date.now()}`;
      await database.create(`orders:${id}`, {
        ...order,
        id: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { ...order, id };
    },
    update: async (id: string, data: Partial<Order>): Promise<Order | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`orders:${id}`, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      if (result) {
        return { ...(result as object), id } as Order;
      }
      return null;
    },
    addMessage: async (orderId: string, message: Order['messages'][0]): Promise<Order | null> => {
      await ensureDBInitialized();
      const order = await db.orders.getById(orderId);
      if (!order) return null;
      const messages = [...order.messages, message];
      return db.orders.update(orderId, { messages });
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`orders:${id}`);
      return true;
    },
  },

  menuItems: {
    getAll: async (): Promise<MenuItem[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('menuItems');
      return mapResults<MenuItem>(result);
    },
    getById: async (id: string): Promise<MenuItem | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`menuItems:${id}`);
      return mapSingleResult<MenuItem>(result, id);
    },
    getByRestaurantId: async (restaurantId: string): Promise<MenuItem[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM menuItems WHERE restaurantId = $restaurantId ORDER BY category, name',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as MenuItem[];
    },
    create: async (item: MenuItem): Promise<MenuItem> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = item.id || `menu_${Date.now()}`;
      await database.create(`menuItems:${id}`, {
        ...item,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...item, id };
    },
    update: async (id: string, data: Partial<MenuItem>): Promise<MenuItem | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`menuItems:${id}`, data);
      if (result) {
        return { ...(result as object), id } as MenuItem;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`menuItems:${id}`);
      return true;
    },
  },

  inventory: {
    getAll: async (): Promise<InventoryItem[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('inventory');
      return mapResults<InventoryItem>(result);
    },
    getById: async (id: string): Promise<InventoryItem | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`inventory:${id}`);
      return mapSingleResult<InventoryItem>(result, id);
    },
    getByRestaurantId: async (restaurantId: string): Promise<InventoryItem[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM inventory WHERE restaurantId = $restaurantId ORDER BY category, name',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as InventoryItem[];
    },
    getLowStock: async (restaurantId: string): Promise<InventoryItem[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM inventory WHERE restaurantId = $restaurantId AND quantity <= minStock',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as InventoryItem[];
    },
    create: async (item: InventoryItem): Promise<InventoryItem> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = item.id || `inv_${Date.now()}`;
      await database.create(`inventory:${id}`, {
        ...item,
        id: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { ...item, id };
    },
    update: async (id: string, data: Partial<InventoryItem>): Promise<InventoryItem | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`inventory:${id}`, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      if (result) {
        return { ...(result as object), id } as InventoryItem;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`inventory:${id}`);
      return true;
    },
  },

  foodWaste: {
    getAll: async (): Promise<FoodWasteRecord[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('foodWaste');
      return mapResults<FoodWasteRecord>(result);
    },
    getById: async (id: string): Promise<FoodWasteRecord | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`foodWaste:${id}`);
      return mapSingleResult<FoodWasteRecord>(result, id);
    },
    getByRestaurantId: async (restaurantId: string): Promise<FoodWasteRecord[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM foodWaste WHERE restaurantId = $restaurantId ORDER BY createdAt DESC',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as FoodWasteRecord[];
    },
    getByDateRange: async (restaurantId: string, startDate: string, endDate: string): Promise<FoodWasteRecord[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM foodWaste WHERE restaurantId = $restaurantId AND date >= $startDate AND date <= $endDate ORDER BY date DESC',
        { restaurantId, startDate, endDate }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as FoodWasteRecord[];
    },
    create: async (record: FoodWasteRecord): Promise<FoodWasteRecord> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = record.id || `waste_${Date.now()}`;
      await database.create(`foodWaste:${id}`, {
        ...record,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...record, id };
    },
    update: async (id: string, data: Partial<FoodWasteRecord>): Promise<FoodWasteRecord | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`foodWaste:${id}`, data);
      if (result) {
        return { ...(result as object), id } as FoodWasteRecord;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`foodWaste:${id}`);
      return true;
    },
  },

  employees: {
    getAll: async (): Promise<Employee[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('employees');
      return mapResults<Employee>(result);
    },
    getById: async (id: string): Promise<Employee | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select(`employees:${id}`);
      return mapSingleResult<Employee>(result, id);
    },
    getByRestaurantId: async (restaurantId: string): Promise<Employee[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM employees WHERE restaurantId = $restaurantId ORDER BY name',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Employee[];
    },
    create: async (employee: Employee & { restaurantId: string }): Promise<Employee> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = employee.id || `emp_${Date.now()}`;
      await database.create(`employees:${id}`, {
        ...employee,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...employee, id };
    },
    update: async (id: string, data: Partial<Employee>): Promise<Employee | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`employees:${id}`, data);
      if (result) {
        return { ...(result as object), id } as Employee;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`employees:${id}`);
      return true;
    },
  },

  schedules: {
    getByRestaurantId: async (restaurantId: string): Promise<WeeklySchedule[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM schedules WHERE restaurantId = $restaurantId ORDER BY weekStartDate DESC',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as WeeklySchedule[];
    },
    getByWeek: async (restaurantId: string, weekStartDate: string): Promise<WeeklySchedule | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM schedules WHERE restaurantId = $restaurantId AND weekStartDate = $weekStartDate LIMIT 1',
        { restaurantId, weekStartDate }
      );
      const records = (result as unknown[][])[0] || [];
      if (records.length > 0) {
        const schedule = records[0] as DBRecord;
        return { ...schedule, id: extractId(schedule) } as WeeklySchedule;
      }
      return null;
    },
    create: async (schedule: WeeklySchedule): Promise<WeeklySchedule> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = schedule.id || `schedule_${Date.now()}`;
      await database.create(`schedules:${id}`, {
        ...schedule,
        id: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { ...schedule, id };
    },
    update: async (id: string, data: Partial<WeeklySchedule>): Promise<WeeklySchedule | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`schedules:${id}`, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      if (result) {
        return { ...(result as object), id } as WeeklySchedule;
      }
      return null;
    },
    delete: async (id: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      await database.delete(`schedules:${id}`);
      return true;
    },
  },

  transactions: {
    getAll: async (): Promise<unknown[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('transactions');
      return mapResults<unknown>(result);
    },
    getByRestaurantId: async (restaurantId: string): Promise<unknown[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM transactions WHERE restaurantId = $restaurantId ORDER BY createdAt DESC',
        { restaurantId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) }));
    },
    create: async (transaction: unknown): Promise<unknown> => {
      await ensureDBInitialized();
      const database = await getDB();
      const trans = transaction as Record<string, unknown>;
      const id = (trans.id as string) || `trans_${Date.now()}`;
      await database.create(`transactions:${id}`, {
        ...trans,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...trans, id };
    },
    update: async (id: string, data: unknown): Promise<unknown | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`transactions:${id}`, data as Record<string, unknown>);
      if (result) {
        return { ...(result as object), id };
      }
      return null;
    },
  },

  verificationCodes: {
    create: async (email: string): Promise<string> => {
      await ensureDBInitialized();
      const database = await getDB();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const id = `vc_${Date.now()}`;
      await database.create(`verificationCodes:${id}`, {
        email,
        code,
        expiresAt,
        createdAt: new Date().toISOString(),
      });
      console.log(`Verification code for ${email}: ${code}`);
      return code;
    },
    verify: async (email: string, code: string): Promise<boolean> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM verificationCodes WHERE email = $email AND code = $code LIMIT 1',
        { email, code }
      );
      const records = (result as unknown[][])[0] || [];
      if (records.length > 0) {
        const stored = records[0] as { code: string; expiresAt: string; id: string };
        if (new Date() > new Date(stored.expiresAt)) return false;
        await database.delete(`verificationCodes:${extractId(stored as DBRecord)}`);
        return true;
      }
      return false;
    },
  },

  payments: {
    getAll: async (): Promise<Payment[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('payments');
      return mapResults<Payment>(result);
    },
    getByUserId: async (userId: string): Promise<Payment[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.query(
        'SELECT * FROM payments WHERE userId = $userId ORDER BY createdAt DESC',
        { userId }
      );
      const records = (result as unknown[][])[0] || [];
      return records.map((r) => ({ ...(r as object), id: extractId(r as DBRecord) })) as Payment[];
    },
    create: async (payment: Payment): Promise<Payment> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = payment.id || `pay_${Date.now()}`;
      await database.create(`payments:${id}`, {
        ...payment,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...payment, id };
    },
    update: async (id: string, data: Partial<Payment>): Promise<Payment | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`payments:${id}`, data);
      if (result) {
        return { ...(result as object), id } as Payment;
      }
      return null;
    },
  },

  callBookings: {
    getAll: async (): Promise<CallBooking[]> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.select('callBookings');
      return mapResults<CallBooking>(result);
    },
    create: async (booking: CallBooking): Promise<CallBooking> => {
      await ensureDBInitialized();
      const database = await getDB();
      const id = booking.id || `call_${Date.now()}`;
      await database.create(`callBookings:${id}`, {
        ...booking,
        id: undefined,
        createdAt: new Date().toISOString(),
      });
      return { ...booking, id };
    },
    update: async (id: string, data: Partial<CallBooking>): Promise<CallBooking | null> => {
      await ensureDBInitialized();
      const database = await getDB();
      const result = await database.merge(`callBookings:${id}`, data);
      if (result) {
        return { ...(result as object), id } as CallBooking;
      }
      return null;
    },
  },
};

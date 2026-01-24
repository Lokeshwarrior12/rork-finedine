import { User, Restaurant, Deal, Coupon, Service, BookingSlot, TableBooking, ServiceBooking } from "@/types";
import { Notification, CallBooking, Payment, PartnerApplication } from "./schema";
import { restaurants as mockRestaurants, deals as mockDeals, userCoupons as mockCoupons, services as mockServices, bookingSlots as mockSlots } from "@/mocks/data";

const users = new Map<string, User>();
const restaurants = new Map<string, Restaurant>();
const deals = new Map<string, Deal>();
const coupons = new Map<string, Coupon>();
const services = new Map<string, Service>();
const bookingSlots = new Map<string, BookingSlot>();
const tableBookings = new Map<string, TableBooking>();
const serviceBookings = new Map<string, ServiceBooking>();
const verificationCodes = new Map<string, { code: string; email: string; expiresAt: Date }>();
const notifications = new Map<string, Notification[]>();
const callBookings = new Map<string, CallBooking>();
const payments = new Map<string, Payment>();
const partnerApplications = new Map<string, PartnerApplication>();

mockRestaurants.forEach(r => restaurants.set(r.id, r));
mockDeals.forEach(d => deals.set(d.id, d));
mockCoupons.forEach(c => coupons.set(c.id, c));
mockServices.forEach(s => services.set(s.id, s));
mockSlots.forEach(bs => bookingSlots.set(bs.id, bs));

users.set('user1', {
  id: 'user1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1 234 567 8900',
  address: '123 Main St, New York, NY 10001',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  role: 'customer',
  points: 1250,
  favorites: ['1', '3'],
  cardDetails: {
    lastFour: '4242',
    expiryDate: '12/27',
    cardType: 'Visa',
  },
});

users.set('owner1', {
  id: 'owner1',
  name: 'Marco Rossi',
  email: 'marco@goldenfork.com',
  phone: '+1 234 567 8900',
  address: '123 Main Street, New York',
  photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  role: 'restaurant_owner',
  points: 0,
  favorites: [],
  restaurantId: '1',
});

export const db = {
  users: {
    getAll: () => Array.from(users.values()),
    getById: (id: string) => users.get(id),
    getByEmail: (email: string) => Array.from(users.values()).find(u => u.email === email),
    create: (user: User) => { users.set(user.id, user); return user; },
    update: (id: string, data: Partial<User>) => {
      const user = users.get(id);
      if (!user) return null;
      const updated = { ...user, ...data };
      users.set(id, updated);
      return updated;
    },
    delete: (id: string) => users.delete(id),
  },
  
  restaurants: {
    getAll: () => Array.from(restaurants.values()),
    getById: (id: string) => restaurants.get(id),
    getByOwnerId: (ownerId: string) => Array.from(restaurants.values()).find(r => r.ownerId === ownerId),
    create: (restaurant: Restaurant) => { restaurants.set(restaurant.id, restaurant); return restaurant; },
    update: (id: string, data: Partial<Restaurant>) => {
      const restaurant = restaurants.get(id);
      if (!restaurant) return null;
      const updated = { ...restaurant, ...data };
      restaurants.set(id, updated);
      return updated;
    },
    delete: (id: string) => restaurants.delete(id),
  },
  
  deals: {
    getAll: () => Array.from(deals.values()),
    getById: (id: string) => deals.get(id),
    getByRestaurantId: (restaurantId: string) => Array.from(deals.values()).filter(d => d.restaurantId === restaurantId),
    getActive: () => Array.from(deals.values()).filter(d => d.isActive),
    create: (deal: Deal) => { deals.set(deal.id, deal); return deal; },
    update: (id: string, data: Partial<Deal>) => {
      const deal = deals.get(id);
      if (!deal) return null;
      const updated = { ...deal, ...data };
      deals.set(id, updated);
      return updated;
    },
    delete: (id: string) => deals.delete(id),
  },
  
  coupons: {
    getAll: () => Array.from(coupons.values()),
    getById: (id: string) => coupons.get(id),
    getByUserId: (userId: string) => Array.from(coupons.values()),
    getByCode: (code: string) => Array.from(coupons.values()).find(c => c.code === code),
    create: (coupon: Coupon) => { coupons.set(coupon.id, coupon); return coupon; },
    update: (id: string, data: Partial<Coupon>) => {
      const coupon = coupons.get(id);
      if (!coupon) return null;
      const updated = { ...coupon, ...data };
      coupons.set(id, updated);
      return updated;
    },
    delete: (id: string) => coupons.delete(id),
  },
  
  services: {
    getAll: () => Array.from(services.values()),
    getById: (id: string) => services.get(id),
    getByRestaurantId: (restaurantId: string) => Array.from(services.values()).filter(s => s.restaurantId === restaurantId),
    create: (service: Service) => { services.set(service.id, service); return service; },
    update: (id: string, data: Partial<Service>) => {
      const service = services.get(id);
      if (!service) return null;
      const updated = { ...service, ...data };
      services.set(id, updated);
      return updated;
    },
    delete: (id: string) => services.delete(id),
  },
  
  bookingSlots: {
    getAll: () => Array.from(bookingSlots.values()),
    getById: (id: string) => bookingSlots.get(id),
    getByRestaurantId: (restaurantId: string) => Array.from(bookingSlots.values()).filter(bs => bs.restaurantId === restaurantId),
    create: (slot: BookingSlot) => { bookingSlots.set(slot.id, slot); return slot; },
    update: (id: string, data: Partial<BookingSlot>) => {
      const slot = bookingSlots.get(id);
      if (!slot) return null;
      const updated = { ...slot, ...data };
      bookingSlots.set(id, updated);
      return updated;
    },
    delete: (id: string) => bookingSlots.delete(id),
  },
  
  tableBookings: {
    getAll: () => Array.from(tableBookings.values()),
    getById: (id: string) => tableBookings.get(id),
    getByUserId: (userId: string) => Array.from(tableBookings.values()).filter(tb => tb.userId === userId),
    getByRestaurantId: (restaurantId: string) => Array.from(tableBookings.values()).filter(tb => tb.restaurantId === restaurantId),
    create: (booking: TableBooking) => { tableBookings.set(booking.id, booking); return booking; },
    update: (id: string, data: Partial<TableBooking>) => {
      const booking = tableBookings.get(id);
      if (!booking) return null;
      const updated = { ...booking, ...data };
      tableBookings.set(id, updated);
      return updated;
    },
    delete: (id: string) => tableBookings.delete(id),
  },
  
  serviceBookings: {
    getAll: () => Array.from(serviceBookings.values()),
    getById: (id: string) => serviceBookings.get(id),
    getByUserId: (userId: string) => Array.from(serviceBookings.values()).filter(sb => sb.userId === userId),
    getByRestaurantId: (restaurantId: string) => Array.from(serviceBookings.values()).filter(sb => sb.restaurantId === restaurantId),
    create: (booking: ServiceBooking) => { serviceBookings.set(booking.id, booking); return booking; },
    update: (id: string, data: Partial<ServiceBooking>) => {
      const booking = serviceBookings.get(id);
      if (!booking) return null;
      const updated = { ...booking, ...data };
      serviceBookings.set(id, updated);
      return updated;
    },
    delete: (id: string) => serviceBookings.delete(id),
  },
  
  verificationCodes: {
    create: (email: string) => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      verificationCodes.set(email, { code, email, expiresAt });
      console.log(`Verification code for ${email}: ${code}`);
      return code;
    },
    verify: (email: string, code: string) => {
      const stored = verificationCodes.get(email);
      if (!stored) return false;
      if (stored.code !== code) return false;
      if (new Date() > stored.expiresAt) return false;
      verificationCodes.delete(email);
      return true;
    },
  },
  
  notifications: {
    getByUserId: (userId: string) => notifications.get(userId) || [],
    create: (notification: Notification) => {
      const userNotifs = notifications.get(notification.userId) || [];
      userNotifs.unshift(notification);
      notifications.set(notification.userId, userNotifs);
      return notification;
    },
    markAsRead: (userId: string, notificationId: string) => {
      const userNotifs = notifications.get(userId) || [];
      const notif = userNotifs.find(n => n.id === notificationId);
      if (notif) notif.read = true;
      return notif;
    },
    notifyFavorites: (restaurantId: string, dealTitle: string) => {
      const restaurant = restaurants.get(restaurantId);
      if (!restaurant) return;
      
      Array.from(users.values()).forEach(user => {
        if (user.favorites.includes(restaurantId)) {
          const notification: Notification = {
            id: `notif_${Date.now()}_${user.id}`,
            userId: user.id,
            restaurantId,
            restaurantName: restaurant.name,
            title: 'New Offer!',
            message: `${restaurant.name} just launched: ${dealTitle}`,
            type: 'offer',
            read: false,
            createdAt: new Date().toISOString(),
          };
          const userNotifs = notifications.get(user.id) || [];
          userNotifs.unshift(notification);
          notifications.set(user.id, userNotifs);
        }
      });
    },
  },
  
  callBookings: {
    getAll: () => Array.from(callBookings.values()),
    getById: (id: string) => callBookings.get(id),
    create: (booking: CallBooking) => { callBookings.set(booking.id, booking); return booking; },
    update: (id: string, data: Partial<CallBooking>) => {
      const booking = callBookings.get(id);
      if (!booking) return null;
      const updated = { ...booking, ...data };
      callBookings.set(id, updated);
      return updated;
    },
  },
  
  payments: {
    getAll: () => Array.from(payments.values()),
    getById: (id: string) => payments.get(id),
    getByUserId: (userId: string) => Array.from(payments.values()).filter(p => p.userId === userId),
    create: (payment: Payment) => { payments.set(payment.id, payment); return payment; },
    update: (id: string, data: Partial<Payment>) => {
      const payment = payments.get(id);
      if (!payment) return null;
      const updated = { ...payment, ...data };
      payments.set(id, updated);
      return updated;
    },
  },
  
  partnerApplications: {
    getAll: () => Array.from(partnerApplications.values()),
    getById: (id: string) => partnerApplications.get(id),
    getByEmail: (email: string) => Array.from(partnerApplications.values()).find(p => p.email === email),
    create: (application: PartnerApplication) => { partnerApplications.set(application.id, application); return application; },
    update: (id: string, data: Partial<PartnerApplication>) => {
      const app = partnerApplications.get(id);
      if (!app) return null;
      const updated = { ...app, ...data };
      partnerApplications.set(id, updated);
      return updated;
    },
  },
};

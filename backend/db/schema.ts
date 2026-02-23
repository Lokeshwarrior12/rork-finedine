// backend/db/schema.ts
import {
  User,
  Restaurant,
  Deal,
  Coupon,
  Service,
  BookingSlot,
  TableBooking,
  ServiceBooking,
} from '@/types';

// ─── Legacy in-memory database shape (kept for reference / tests) ───────────
export interface Database {
  users: Map<string, User>;
  restaurants: Map<string, Restaurant>;
  deals: Map<string, Deal>;
  coupons: Map<string, Coupon>;
  services: Map<string, Service>;
  bookingSlots: Map<string, BookingSlot>;
  tableBookings: Map<string, TableBooking>;
  serviceBookings: Map<string, ServiceBooking>;
  verificationCodes: Map<
    string,
    { code: string; email: string; expiresAt: Date }
  >;
  notifications: Map<string, Notification[]>;
  callBookings: Map<string, CallBooking>;
  payments: Map<string, Payment>;
}

// ─── Notification ────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  message: string;
  type: 'offer' | 'booking' | 'general';
  read: boolean;
  createdAt: string;
}

// ─── CallBooking ─────────────────────────────────────────────────────────────
export interface CallBooking {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'booking' | 'service';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

// ─── PartnerApplication ──────────────────────────────────────────────────────
export interface PartnerApplication {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationCode?: string;
  createdAt: string;
}

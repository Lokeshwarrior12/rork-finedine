/* ============================================================
   Core User & Auth
============================================================ */

export type UserRole = 'customer' | 'restaurant_owner';

export interface CardDetails {
  lastFour: string;
  expiryDate: string;
  cardType: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photo?: string;
  role: UserRole;
  points: number;
  favorites: string[];
  cardDetails?: CardDetails;
  restaurantId?: string;
  cuisinePreferences?: string[];
}

/* ============================================================
   Restaurant
============================================================ */

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisineType: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  logo?: string;
  images: string[];
  openingHours: string;
  waitingTime: string;
  categories: string[];
  acceptsTableBooking: boolean;
  bookingTerms?: string;
  ownerId: string;
}

/* ============================================================
   Deals & Coupons
============================================================ */

export type OfferType = 'dinein' | 'pickup' | 'both';

export interface Deal {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  title: string;
  description: string;
  discountPercent: number;
  offerType: OfferType;
  maxCoupons: number;
  claimedCoupons: number;
  minOrder: number;
  validTill: string;
  daysAvailable: string[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  termsConditions: string;
}

export type CouponStatus = 'active' | 'used' | 'expired';

export interface Coupon {
  id: string;
  dealId: string;
  dealTitle: string;
  restaurantName: string;
  restaurantImage: string;
  discountPercent: number;
  status: CouponStatus;
  claimedAt: string;
  usedAt?: string;
  expiresAt: string;
  code: string;
}

/* ============================================================
   Services & Bookings
============================================================ */

export interface Service {
  id: string;
  restaurantId: string;
  name: string;
  pricePerPerson: number;
  minGuests: number;
  maxGuests: number;
  isActive: boolean;
  description?: string;
}

export interface BookingSlot {
  id: string;
  restaurantId: string;
  name: string;
  startTime: string;
  endTime: string;
  maxGuests: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface TableBooking {
  id: string;
  restaurantId: string;
  userId: string;
  date: string;
  time: string;
  guests: number;
  tableType: string;
  specialRequests?: string;
  status: BookingStatus;
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  restaurantId: string;
  userId: string;
  date: string;
  timeSlot: string;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
}

/* ============================================================
   Orders
============================================================ */

export type OrderType = 'dinein' | 'pickup';
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface OrderMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderType: 'restaurant' | 'customer';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerPhoto?: string;
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  tableNumber?: string;
  pickupTime?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number;
  messages: OrderMessage[];
}

/* ============================================================
   Analytics
============================================================ */

export interface DailyActivity {
  day: string;
  count: number;
}

export interface OfferTypeDistribution {
  dinein: number;
  takeout: number;
  both: number;
}

export interface DiscountRange {
  range: string;
  count: number;
}

export interface Analytics {
  totalCoupons: number;
  redemptionRate: number;
  activeCoupons: number;
  usedCoupons: number;
  dailyActivity: DailyActivity[];
  offerTypeDistribution: OfferTypeDistribution;
  discountRangeDistribution: DiscountRange[];
}

/* ============================================================
   Employees & Scheduling
============================================================ */

export interface DayAvailability {
  available: boolean;
  startTime?: string;
  endTime?: string;
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface Employee {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: string;
  availability: WeeklyAvailability;
  hourlyRate?: number;
}

export type ShiftStatus = 'scheduled' | 'swapRequested' | 'completed' | 'cancelled';

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  role: string;
  status: ShiftStatus;
  swapRequestedWith?: string;
}

export interface WeeklySchedule {
  id: string;
  restaurantId: string;
  weekStartDate: string;
  weekEndDate: string;
  shifts: Shift[];
  createdAt: string;
  updatedAt: string;
}

/* ============================================================
   Payments & Sales
============================================================ */

export type PaymentMethod = 'cash' | 'card' | 'upi';
export type TransactionStatus = 'pending' | 'completed' | 'refunded';

export interface Transaction {
  id: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  couponId?: string;
  couponCode?: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  createdAt: string;
}

export interface OfferPerformance {
  offerId: string;
  offerTitle: string;
  redemptions: number;
  revenue: number;
}

export interface PeakHour {
  hour: string;
  transactions: number;
  revenue: number;
}

export interface SalesRecommendation {
  id: string;
  type: 'timing' | 'discount' | 'promotion' | 'inventory';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  basedOn: string;
}

export interface SalesAnalytics {
  restaurantId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  topOffers: OfferPerformance[];
  peakHours: PeakHour[];
  recommendations: SalesRecommendation[];
}

/* ============================================================
   Waste Management
============================================================ */

export type WasteReason =
  | 'expired'
  | 'spoiled'
  | 'overproduction'
  | 'customer_return'
  | 'preparation_error'
  | 'other';

export interface FoodWasteRecord {
  id: string;
  restaurantId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  reason: WasteReason;
  costPerUnit: number;
  totalCost: number;
  date: string;
  time: string;
  recordedBy?: string;
  notes?: string;
  inventoryItemId?: string;
}

export interface WasteCategoryBreakdown {
  category: string;
  quantity: number;
  cost: number;
  percentage: number;
}

export interface WasteReasonBreakdown {
  reason: string;
  count: number;
  cost: number;
  percentage: number;
}

export interface WasteTrendData {
  date: string;
  quantity: number;
  cost: number;
}

export interface TopWastedItem {
  itemName: string;
  category: string;
  totalQuantity: number;
  totalCost: number;
  frequency: number;
  avgQuantityPerIncident: number;
}

export interface WasteRecommendation {
  id: string;
  type: 'ordering' | 'storage' | 'preparation' | 'menu' | 'rotation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  potentialSavings: number;
  basedOn: string;
}

export interface WasteAnalytics {
  totalWasteThisMonth: number;
  totalCostThisMonth: number;
  wasteByCategory: WasteCategoryBreakdown[];
  wasteByReason: WasteReasonBreakdown[];
  wasteTrend: WasteTrendData[];
  topWastedItems: TopWastedItem[];
  recommendations: WasteRecommendation[];
  comparisonToPreviousMonth: {
    wasteChange: number;
    costChange: number;
  };
}

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { Analytics } from "@/types";

export const analyticsRouter = createTRPCRouter({
  getRestaurantAnalytics: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(({ input }) => {
      const deals = db.deals.getByRestaurantId(input.restaurantId);
      const allCoupons = db.coupons.getAll();
      
      const totalCoupons = deals.reduce((sum, d) => sum + d.claimedCoupons, 0);
      const activeCoupons = deals.filter(d => d.isActive).reduce((sum, d) => sum + d.claimedCoupons, 0);
      const usedCoupons = allCoupons.filter(c => c.status === 'used').length;
      
      const redemptionRate = totalCoupons > 0 ? Math.round((usedCoupons / totalCoupons) * 100) : 0;
      
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dailyActivity = days.map(day => ({
        day,
        count: Math.floor(Math.random() * 50) + 10,
      }));
      
      const dineinDeals = deals.filter(d => d.offerType === 'dinein').length;
      const pickupDeals = deals.filter(d => d.offerType === 'pickup').length;
      const bothDeals = deals.filter(d => d.offerType === 'both').length;
      const totalDeals = dineinDeals + pickupDeals + bothDeals;
      
      const offerTypeDistribution = {
        dinein: totalDeals > 0 ? Math.round((dineinDeals / totalDeals) * 100) : 0,
        takeout: totalDeals > 0 ? Math.round((pickupDeals / totalDeals) * 100) : 0,
        both: totalDeals > 0 ? Math.round((bothDeals / totalDeals) * 100) : 0,
      };
      
      const discountRanges = [
        { range: '10-20%', min: 10, max: 20 },
        { range: '21-30%', min: 21, max: 30 },
        { range: '31-40%', min: 31, max: 40 },
        { range: '41-50%', min: 41, max: 50 },
      ];
      
      const discountRangeDistribution = discountRanges.map(({ range, min, max }) => ({
        range,
        count: deals.filter(d => d.discountPercent >= min && d.discountPercent <= max).length,
      }));
      
      const analytics: Analytics = {
        totalCoupons,
        redemptionRate,
        activeCoupons,
        usedCoupons,
        dailyActivity,
        offerTypeDistribution,
        discountRangeDistribution,
      };
      
      return analytics;
    }),

  exportToPdf: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .mutation(({ input }) => {
      const deals = db.deals.getByRestaurantId(input.restaurantId);
      const restaurant = db.restaurants.getById(input.restaurantId);
      
      const totalCoupons = deals.reduce((sum, d) => sum + d.claimedCoupons, 0);
      const activeDeals = deals.filter(d => d.isActive).length;
      
      const csvContent = [
        'FineDine Analytics Report',
        `Restaurant: ${restaurant?.name || 'Unknown'}`,
        `Generated: ${new Date().toISOString()}`,
        '',
        'Deal Title,Discount %,Type,Claimed,Max Coupons,Status',
        ...deals.map(d => 
          `${d.title},${d.discountPercent}%,${d.offerType},${d.claimedCoupons},${d.maxCoupons},${d.isActive ? 'Active' : 'Inactive'}`
        ),
        '',
        'Summary',
        `Total Deals: ${deals.length}`,
        `Active Deals: ${activeDeals}`,
        `Total Coupons Claimed: ${totalCoupons}`,
      ].join('\n');
      
      const base64Data = Buffer.from(csvContent).toString('base64');
      
      return {
        filename: `analytics_${input.restaurantId}_${Date.now()}.csv`,
        data: base64Data,
        mimeType: 'text/csv',
      };
    }),

  getDashboardStats: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(({ input }) => {
      const deals = db.deals.getByRestaurantId(input.restaurantId);
      
      const activeOffers = deals.filter(d => d.isActive).length;
      const todayCoupons = deals.reduce((sum, d) => sum + d.claimedCoupons, 0);
      const totalClaimed = deals.reduce((sum, d) => sum + d.claimedCoupons, 0);
      const favoritesCount = db.users.getAll().filter(u => u.favorites.includes(input.restaurantId)).length;
      
      return {
        activeOffers,
        todayCoupons,
        totalClaimed,
        favoritesCount,
      };
    }),

  getRecentActivity: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(({ input }) => {
      const tableBookings = db.tableBookings.getByRestaurantId(input.restaurantId);
      const serviceBookings = db.serviceBookings.getByRestaurantId(input.restaurantId);
      
      const activities = [
        ...tableBookings.map(b => ({
          id: b.id,
          type: 'table_booking' as const,
          description: `Table booking for ${b.guests} guests`,
          date: b.date,
          status: b.status,
        })),
        ...serviceBookings.map(b => ({
          id: b.id,
          type: 'service_booking' as const,
          description: `${b.serviceName} booking for ${b.guests} guests`,
          date: b.date,
          status: b.status,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      
      return activities;
    }),
});

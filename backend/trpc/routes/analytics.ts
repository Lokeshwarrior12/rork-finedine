import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { Transaction } from "@/types";

export const analyticsRouter = createTRPCRouter({
  getRestaurantAnalytics: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const deals = await db.deals.getByRestaurantId(input.restaurantId);
      const coupons = await db.coupons.getAll();
      const restaurantCoupons = coupons.filter(c => {
        const deal = deals.find(d => d.id === c.dealId);
        return deal !== undefined;
      });

      const totalCoupons = restaurantCoupons.length;
      const usedCoupons = restaurantCoupons.filter(c => c.status === 'used').length;
      const activeCoupons = restaurantCoupons.filter(c => c.status === 'active').length;
      const redemptionRate = totalCoupons > 0 ? (usedCoupons / totalCoupons) * 100 : 0;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyActivity = dayNames.map(day => {
        const count = restaurantCoupons.filter(c => {
          const claimedDay = new Date(c.claimedAt).getDay();
          return dayNames[claimedDay] === day;
        }).length;
        return { day, count };
      });

      const offerTypeDistribution = {
        dinein: deals.filter(d => d.offerType === 'dinein').length,
        takeout: deals.filter(d => d.offerType === 'pickup').length,
        both: deals.filter(d => d.offerType === 'both').length,
      };

      const discountRangeDistribution = [
        { range: '0-20%', count: deals.filter(d => d.discountPercent <= 20).length },
        { range: '21-40%', count: deals.filter(d => d.discountPercent > 20 && d.discountPercent <= 40).length },
        { range: '41-60%', count: deals.filter(d => d.discountPercent > 40 && d.discountPercent <= 60).length },
        { range: '60%+', count: deals.filter(d => d.discountPercent > 60).length },
      ];

      return {
        totalCoupons,
        redemptionRate: Math.round(redemptionRate * 10) / 10,
        activeCoupons,
        usedCoupons,
        dailyActivity,
        offerTypeDistribution,
        discountRangeDistribution,
      };
    }),

  getDashboardStats: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const deals = await db.deals.getByRestaurantId(input.restaurantId);
      const tableBookings = await db.tableBookings.getByRestaurantId(input.restaurantId);
      const orders = await db.orders.getByRestaurantId(input.restaurantId);
      const transactions = await db.transactions.getByRestaurantId(input.restaurantId);

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
      const todayBookings = tableBookings.filter(b => b.date === today);

      const typedTransactions = transactions as Transaction[];
      const totalRevenue = typedTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.finalAmount, 0);

      const todayRevenue = typedTransactions
        .filter(t => t.status === 'completed' && t.createdAt.startsWith(today))
        .reduce((sum, t) => sum + t.finalAmount, 0);

      return {
        activeDeals: deals.filter(d => d.isActive).length,
        totalDeals: deals.length,
        pendingBookings: tableBookings.filter(b => b.status === 'pending').length,
        confirmedBookings: tableBookings.filter(b => b.status === 'confirmed').length,
        todayBookings: todayBookings.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        todayOrders: todayOrders.length,
        totalRevenue,
        todayRevenue,
        totalTransactions: transactions.length,
      };
    }),
});

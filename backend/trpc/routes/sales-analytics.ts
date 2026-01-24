import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db";
import { SalesAnalytics, SalesRecommendation, Transaction, Order, Deal } from "@/types";

export const salesAnalyticsRouter = createTRPCRouter({
  getSalesAnalytics: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      period: z.enum(['daily', 'weekly', 'monthly']),
    }))
    .query(async ({ input }) => {
      const transactions = await db.transactions.getByRestaurantId(input.restaurantId);
      const orders = await db.orders.getByRestaurantId(input.restaurantId);
      const deals = await db.deals.getByRestaurantId(input.restaurantId);

      const typedTransactions = transactions as Transaction[];
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const filteredTransactions = typedTransactions.filter(
        t => new Date(t.createdAt) >= startDate && t.status === 'completed'
      );

      const totalSales = filteredTransactions.reduce((sum, t) => sum + t.finalAmount, 0);
      const totalTransactionsCount = filteredTransactions.length;
      const averageOrderValue = totalTransactionsCount > 0 ? totalSales / totalTransactionsCount : 0;

      const offerPerformance: Record<string, { redemptions: number; revenue: number }> = {};
      filteredTransactions.forEach(t => {
        if (t.couponId) {
          if (!offerPerformance[t.couponId]) {
            offerPerformance[t.couponId] = { redemptions: 0, revenue: 0 };
          }
          offerPerformance[t.couponId].redemptions += 1;
          offerPerformance[t.couponId].revenue += t.finalAmount;
        }
      });

      const topOffers = deals
        .filter(d => offerPerformance[d.id])
        .map(d => ({
          offerId: d.id,
          offerTitle: d.title,
          redemptions: offerPerformance[d.id]?.redemptions || 0,
          revenue: offerPerformance[d.id]?.revenue || 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const hourlyData: Record<string, { transactions: number; revenue: number }> = {};
      filteredTransactions.forEach(t => {
        const hour = new Date(t.createdAt).getHours();
        const hourKey = `${hour}:00`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { transactions: 0, revenue: 0 };
        }
        hourlyData[hourKey].transactions += 1;
        hourlyData[hourKey].revenue += t.finalAmount;
      });

      const peakHours = Object.entries(hourlyData)
        .map(([hour, data]) => ({ hour, ...data }))
        .sort((a, b) => b.transactions - a.transactions)
        .slice(0, 5);

      const recommendations = generateSalesRecommendations(
        filteredTransactions,
        orders,
        deals,
        peakHours
      );

      const analytics: SalesAnalytics = {
        restaurantId: input.restaurantId,
        period: input.period,
        totalSales,
        totalTransactions: totalTransactionsCount,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        topOffers,
        peakHours,
        recommendations,
      };

      return analytics;
    }),

  getRevenueChart: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      days: z.number().default(7),
    }))
    .query(async ({ input }) => {
      const transactions = await db.transactions.getByRestaurantId(input.restaurantId);
      const now = new Date();
      const startDate = new Date(now.getTime() - input.days * 24 * 60 * 60 * 1000);

      const dailyRevenue: Record<string, number> = {};

      for (let i = 0; i < input.days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        dailyRevenue[dateKey] = 0;
      }

      const typedTrans = transactions as Transaction[];
      typedTrans
        .filter(t => new Date(t.createdAt) >= startDate && t.status === 'completed')
        .forEach(t => {
          const dateKey = t.createdAt.split('T')[0];
          if (dailyRevenue[dateKey] !== undefined) {
            dailyRevenue[dateKey] += t.finalAmount;
          }
        });

      return Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
      }));
    }),

  getOrderTypeBreakdown: protectedProcedure
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input }) => {
      const orders = await db.orders.getByRestaurantId(input.restaurantId);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyOrders = orders.filter(o => new Date(o.createdAt) >= monthStart);

      const dineinOrders = monthlyOrders.filter(o => o.orderType === 'dinein');
      const pickupOrders = monthlyOrders.filter(o => o.orderType === 'pickup');

      return {
        dinein: {
          count: dineinOrders.length,
          revenue: dineinOrders.reduce((sum, o) => sum + o.total, 0),
        },
        pickup: {
          count: pickupOrders.length,
          revenue: pickupOrders.reduce((sum, o) => sum + o.total, 0),
        },
        total: {
          count: monthlyOrders.length,
          revenue: monthlyOrders.reduce((sum, o) => sum + o.total, 0),
        },
      };
    }),
});

function generateSalesRecommendations(
  transactions: any[],
  orders: any[],
  deals: any[],
  peakHours: any[]
): SalesRecommendation[] {
  const recommendations: SalesRecommendation[] = [];

  if (peakHours.length > 0) {
    const topPeak = peakHours[0];
    recommendations.push({
      id: 'rec_timing_1',
      type: 'timing',
      title: 'Capitalize on Peak Hours',
      description: `Your busiest time is around ${topPeak.hour}. Consider adding flash deals during this period to maximize revenue.`,
      impact: 'high',
      basedOn: `${topPeak.transactions} transactions during ${topPeak.hour}`,
    });
  }

  const activeDeals = deals.filter(d => d.isActive);
  if (activeDeals.length < 3) {
    recommendations.push({
      id: 'rec_promo_1',
      type: 'promotion',
      title: 'Increase Active Promotions',
      description: 'Running more concurrent deals can increase customer engagement and order volume.',
      impact: 'medium',
      basedOn: `Currently only ${activeDeals.length} active deals`,
    });
  }

  const highDiscountDeals = deals.filter(d => d.discountPercent > 40);
  if (highDiscountDeals.length > deals.length * 0.5) {
    recommendations.push({
      id: 'rec_discount_1',
      type: 'discount',
      title: 'Optimize Discount Strategy',
      description: 'Consider reducing discount percentages on popular items to improve profit margins while maintaining volume.',
      impact: 'high',
      basedOn: `${highDiscountDeals.length} deals with >40% discount`,
    });
  }

  const cancelledOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'rejected');
  if (cancelledOrders.length > orders.length * 0.1) {
    recommendations.push({
      id: 'rec_inventory_1',
      type: 'inventory',
      title: 'Reduce Order Cancellations',
      description: 'High cancellation rate detected. Review inventory management and order acceptance criteria.',
      impact: 'high',
      basedOn: `${cancelledOrders.length} cancelled orders (${Math.round(cancelledOrders.length / orders.length * 100)}%)`,
    });
  }

  return recommendations;
}

import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { SalesAnalytics, SalesRecommendation, OfferPerformance, PeakHour, Transaction } from "@/types";

const generateRecommendations = (
  transactions: Transaction[],
  period: 'daily' | 'weekly' | 'monthly'
): SalesRecommendation[] => {
  const recommendations: SalesRecommendation[] = [];
  
  if (transactions.length === 0) {
    recommendations.push({
      id: 'rec_1',
      type: 'promotion',
      title: 'Launch Your First Offer',
      description: 'Create an attractive 30-40% discount offer to attract new customers. First-time offers typically see 3x more engagement.',
      impact: 'high',
      basedOn: 'No transaction history',
    });
    return recommendations;
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + t.finalAmount, 0);
  const avgOrderValue = totalRevenue / transactions.length;
  const totalDiscount = transactions.reduce((sum, t) => sum + t.discountAmount, 0);
  const avgDiscount = totalDiscount / transactions.length;

  const hourCounts: Record<number, { count: number; revenue: number }> = {};
  transactions.forEach(t => {
    const hour = new Date(t.createdAt).getHours();
    if (!hourCounts[hour]) hourCounts[hour] = { count: 0, revenue: 0 };
    hourCounts[hour].count++;
    hourCounts[hour].revenue += t.finalAmount;
  });

  const sortedHours = Object.entries(hourCounts)
    .sort((a, b) => b[1].count - a[1].count);
  
  const peakHour = sortedHours[0]?.[0];
  const slowestHour = sortedHours[sortedHours.length - 1]?.[0];

  if (peakHour && slowestHour && peakHour !== slowestHour) {
    recommendations.push({
      id: `rec_timing_${Date.now()}`,
      type: 'timing',
      title: 'Optimize Off-Peak Hours',
      description: `Your peak sales are at ${peakHour}:00. Consider offering higher discounts (40-50%) during ${slowestHour}:00 to boost traffic during slow periods.`,
      impact: 'high',
      basedOn: `Analysis of ${transactions.length} transactions`,
    });
  }

  if (avgOrderValue < 50) {
    recommendations.push({
      id: `rec_upsell_${Date.now()}`,
      type: 'promotion',
      title: 'Increase Average Order Value',
      description: `Your average order is $${avgOrderValue.toFixed(2)}. Consider bundle deals or minimum order requirements of $60+ for discounts to increase ticket size.`,
      impact: 'medium',
      basedOn: `Average order value analysis`,
    });
  }

  const cardPayments = transactions.filter(t => t.paymentMethod === 'card').length;
  const cardPercentage = (cardPayments / transactions.length) * 100;
  
  if (cardPercentage < 50) {
    recommendations.push({
      id: `rec_payment_${Date.now()}`,
      type: 'promotion',
      title: 'Promote Digital Payments',
      description: `Only ${cardPercentage.toFixed(0)}% of transactions use card/digital payment. Offer an extra 5% off for card payments to track customer data better.`,
      impact: 'low',
      basedOn: 'Payment method analysis',
    });
  }

  const discountPercentage = (totalDiscount / (totalRevenue + totalDiscount)) * 100;
  if (discountPercentage > 35) {
    recommendations.push({
      id: `rec_discount_${Date.now()}`,
      type: 'discount',
      title: 'Optimize Discount Strategy',
      description: `You're giving ${discountPercentage.toFixed(1)}% in discounts on average. Consider tiered discounts: 30% for new customers, 35% for returning customers to balance acquisition and margin.`,
      impact: 'high',
      basedOn: 'Discount rate analysis',
    });
  }

  const weekdayCount = transactions.filter(t => {
    const day = new Date(t.createdAt).getDay();
    return day >= 1 && day <= 5;
  }).length;
  const weekendCount = transactions.length - weekdayCount;
  
  if (weekendCount < weekdayCount * 0.5) {
    recommendations.push({
      id: `rec_weekend_${Date.now()}`,
      type: 'timing',
      title: 'Boost Weekend Traffic',
      description: 'Your weekend transactions are significantly lower than weekdays. Launch a "Weekend Special" with exclusive 45% discounts to drive weekend visits.',
      impact: 'medium',
      basedOn: 'Day-of-week analysis',
    });
  }

  recommendations.push({
    id: `rec_loyalty_${Date.now()}`,
    type: 'promotion',
    title: 'Implement Loyalty Bonuses',
    description: 'Offer double loyalty points on Tuesdays (typically slow day). This encourages repeat visits and builds customer database.',
    impact: 'medium',
    basedOn: 'Industry best practices',
  });

  if (transactions.length >= 10) {
    recommendations.push({
      id: `rec_happy_hour_${Date.now()}`,
      type: 'timing',
      title: 'Extended Happy Hour',
      description: 'Based on your traffic patterns, consider extending happy hour discounts to 3-6 PM. Restaurants with longer discount windows see 25% more redemptions.',
      impact: 'medium',
      basedOn: 'Traffic pattern analysis',
    });
  }

  return recommendations.slice(0, 5);
};

const mockTransactions: Transaction[] = [
  { id: 'txn_1', restaurantId: '1', customerId: 'u1', customerName: 'John', originalAmount: 85, discountAmount: 25.5, finalAmount: 59.5, paymentMethod: 'card', status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'txn_2', restaurantId: '1', customerId: 'u2', customerName: 'Sarah', originalAmount: 120, discountAmount: 48, finalAmount: 72, paymentMethod: 'cash', status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'txn_3', restaurantId: '1', customerId: 'u3', customerName: 'Mike', originalAmount: 65, discountAmount: 19.5, finalAmount: 45.5, paymentMethod: 'upi', status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'txn_4', restaurantId: '1', customerId: 'u4', customerName: 'Emily', originalAmount: 95, discountAmount: 38, finalAmount: 57, paymentMethod: 'card', status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 'txn_5', restaurantId: '1', customerId: 'u5', customerName: 'David', originalAmount: 150, discountAmount: 45, finalAmount: 105, paymentMethod: 'card', status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
  { id: 'txn_6', restaurantId: '1', customerId: 'u6', customerName: 'Lisa', originalAmount: 78, discountAmount: 23.4, finalAmount: 54.6, paymentMethod: 'cash', status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString() },
  { id: 'txn_7', restaurantId: '1', customerId: 'u7', customerName: 'Tom', originalAmount: 110, discountAmount: 44, finalAmount: 66, paymentMethod: 'upi', status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() },
  { id: 'txn_8', restaurantId: '1', customerId: 'u8', customerName: 'Anna', originalAmount: 88, discountAmount: 26.4, finalAmount: 61.6, paymentMethod: 'card', status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString() },
];

export const salesAnalyticsRouter = createTRPCRouter({
  getAnalytics: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      period: z.enum(['daily', 'weekly', 'monthly']),
    }))
    .query(({ input }) => {
      const now = new Date();
      let startDate: Date;
      
      switch (input.period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      const filteredTxns = mockTransactions.filter(t => 
        t.restaurantId === input.restaurantId && 
        new Date(t.createdAt) >= startDate
      );
      
      const totalSales = filteredTxns.reduce((sum, t) => sum + t.finalAmount, 0);
      const avgOrderValue = filteredTxns.length > 0 ? totalSales / filteredTxns.length : 0;

      const hourCounts: Record<string, { transactions: number; revenue: number }> = {};
      for (let i = 9; i <= 22; i++) {
        const hour = `${i}:00`;
        hourCounts[hour] = { transactions: 0, revenue: 0 };
      }
      
      filteredTxns.forEach(t => {
        const hour = new Date(t.createdAt).getHours();
        const hourKey = `${hour}:00`;
        if (hourCounts[hourKey]) {
          hourCounts[hourKey].transactions++;
          hourCounts[hourKey].revenue += t.finalAmount;
        }
      });
      
      const peakHours: PeakHour[] = Object.entries(hourCounts)
        .map(([hour, data]) => ({
          hour,
          transactions: data.transactions,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.transactions - a.transactions);

      const offerPerformance: OfferPerformance[] = [
        { offerId: '1', offerTitle: '30% Off Weekend Brunch', redemptions: 45, revenue: 2850 },
        { offerId: '2', offerTitle: '40% Happy Hour Special', redemptions: 38, revenue: 1900 },
        { offerId: '3', offerTitle: '35% Family Dinner Deal', redemptions: 28, revenue: 2240 },
      ];

      const recommendations = generateRecommendations(filteredTxns, input.period);

      const analytics: SalesAnalytics = {
        restaurantId: input.restaurantId,
        period: input.period,
        totalSales,
        totalTransactions: filteredTxns.length,
        averageOrderValue: avgOrderValue,
        topOffers: offerPerformance,
        peakHours,
        recommendations,
      };
      
      return analytics;
    }),

  getRecommendations: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
    }))
    .query(({ input }) => {
      const transactions = mockTransactions.filter(t => t.restaurantId === input.restaurantId);
      return generateRecommendations(transactions, 'monthly');
    }),

  getDailyTrend: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
      days: z.number().default(7),
    }))
    .query(({ input }) => {
      const trend = [];
      const now = new Date();
      
      for (let i = input.days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayTxns = mockTransactions.filter(t => {
          const txnDate = new Date(t.createdAt);
          return txnDate >= dayStart && txnDate < dayEnd;
        });
        
        trend.push({
          date: dateStr,
          transactions: dayTxns.length,
          revenue: dayTxns.reduce((sum, t) => sum + t.finalAmount, 0),
          discounts: dayTxns.reduce((sum, t) => sum + t.discountAmount, 0),
        });
      }
      
      return trend;
    }),

  getOfferComparison: protectedProcedure
    .input(z.object({
      restaurantId: z.string(),
    }))
    .query(() => {
      return [
        { name: '30% Off', redemptions: 45, revenue: 2850, conversionRate: 68 },
        { name: '35% Off', redemptions: 38, revenue: 2660, conversionRate: 72 },
        { name: '40% Off', redemptions: 52, revenue: 2600, conversionRate: 85 },
        { name: '45% Off', redemptions: 28, revenue: 1540, conversionRate: 91 },
      ];
    }),
});

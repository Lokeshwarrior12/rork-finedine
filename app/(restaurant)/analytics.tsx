// app/(restaurant)/analytics.tsx
// Restaurant Analytics Screen - REAL DATA FROM DATABASE
// NO MOCK DATA - All metrics fetched from backend API

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  TrendingUp,
  DollarSign,
  Clock,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Zap,
  Share2,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const { width } = Dimensions.get('window');

type Period = 'today' | 'week' | 'month';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');

  // Get restaurant ID from user profile
  // REAL DATA: Fetched from user's profile in database
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getUserProfile(),
    enabled: !!user,
  });

  const restaurantId = profileData?.data?.restaurantId;

  // REAL DATA: Fetch analytics from backend
  // Backend endpoint: GET /api/v1/restaurants/:id/analytics?period=today|week|month
  // Database queries: Aggregates orders, revenue, transactions from PostgreSQL
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['restaurant-analytics', restaurantId, selectedPeriod],
    queryFn: () => api.getRestaurantAnalytics(restaurantId!, selectedPeriod),
    enabled: !!restaurantId,
    staleTime: 60 * 1000, // Cache for 1 minute (analytics change frequently)
  });

  const analytics = analyticsData?.data || null;

  const handleExport = async () => {
    if (!analytics) return;

    const reportText = `📊 Analytics Report - ${selectedPeriod.toUpperCase()}\n\n` +
      `Revenue: $${analytics.revenue?.toFixed(2) || '0.00'}\n` +
      `Transactions: ${analytics.transactions || 0}\n` +
      `Avg Order: $${analytics.avgOrderValue?.toFixed(2) || '0.00'}\n` +
      `Redemption Rate: ${analytics.redemptionRate || 0}%\n\n` +
      `Generated: ${new Date().toLocaleString()}`;

    try {
      await Share.share({
        message: reportText,
        title: 'Analytics Report',
      });
    } catch (error) {
      console.log('Export error:', error);
    }
  };

  const styles = createStyles(colors, isDark);

  // LOADING STATE
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { marginTop: 16 }]}>Loading analytics...</Text>
      </View>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <AlertCircle size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Failed to Load Analytics</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Something went wrong'}
        </Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // NO RESTAURANT ID
  if (!restaurantId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <AlertCircle size={64} color={colors.warning} />
        <Text style={styles.errorTitle}>Restaurant Not Found</Text>
        <Text style={styles.errorMessage}>
          Please contact support to link your restaurant.
        </Text>
      </View>
    );
  }

  // REAL DATA: Calculate stats from database response
  const stats = [
    {
      label: 'Total Revenue',
      value: `$${analytics?.revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: colors.success,
      trend: analytics?.revenueTrend || '+0%',
      trendUp: (analytics?.revenueTrend || '').startsWith('+'),
    },
    {
      label: 'Transactions',
      value: analytics?.transactions?.toString() || '0',
      icon: ShoppingBag,
      color: colors.primary,
      trend: analytics?.transactionsTrend || '+0%',
      trendUp: (analytics?.transactionsTrend || '').startsWith('+'),
    },
    {
      label: 'Avg. Order',
      value: `$${analytics?.avgOrderValue?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: colors.accent,
      trend: analytics?.avgOrderTrend || '+0%',
      trendUp: (analytics?.avgOrderTrend || '').startsWith('+'),
    },
    {
      label: 'New Customers',
      value: analytics?.newCustomers?.toString() || '0',
      icon: Clock,
      color: colors.secondary,
      trend: analytics?.customerTrend || '+0%',
      trendUp: (analytics?.customerTrend || '').startsWith('+'),
    },
  ];

  // REAL DATA: Get max values for chart scaling
  const maxRevenue = analytics?.dailyTrend?.length > 0
    ? Math.max(...analytics.dailyTrend.map((d: any) => d.revenue))
    : 1;

  const maxPeakTransactions = analytics?.peakHours?.length > 0
    ? Math.max(...analytics.peakHours.map((h: any) => h.transactions))
    : 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.exportButton} onPress={handleExport}>
            <Share2 size={18} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.exportButton} onPress={handleExport}>
            <Download size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <Pressable
            key={period}
            style={[styles.periodBtn, selectedPeriod === period && styles.periodBtnActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.periodBtnText, selectedPeriod === period && styles.periodBtnTextActive]}>
              {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Stats Grid - REAL DATA */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <stat.icon size={18} color={stat.color} />
                </View>
                <View style={[styles.trendBadge, { backgroundColor: stat.trendUp ? colors.successLight : colors.errorLight }]}>
                  {stat.trendUp ? (
                    <ArrowUpRight size={12} color={colors.success} />
                  ) : (
                    <ArrowDownRight size={12} color={colors.error} />
                  )}
                  <Text style={[styles.trendText, { color: stat.trendUp ? colors.success : colors.error }]}>
                    {stat.trend}
                  </Text>
                </View>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* AI Recommendations - REAL DATA */}
        {analytics?.recommendations && analytics.recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Lightbulb size={20} color={colors.warning} />
                <Text style={styles.sectionTitle}>AI Recommendations</Text>
              </View>
              <View style={styles.aiBadge}>
                <Zap size={12} color="#fff" />
                <Text style={styles.aiBadgeText}>Smart</Text>
              </View>
            </View>

            {analytics.recommendations.map((rec: any, index: number) => (
              <View key={rec.id || index} style={styles.recommendationCard}>
                <View style={[styles.recIcon, { backgroundColor: colors.primaryLight }]}>
                  <Lightbulb size={20} color={colors.primary} />
                </View>
                <View style={styles.recContent}>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                  <Text style={styles.recDescription} numberOfLines={2}>
                    {rec.description}
                  </Text>
                  {rec.impact && (
                    <Text style={styles.recBasedOn}>Impact: {rec.impact}</Text>
                  )}
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            ))}
          </View>
        )}

        {/* Revenue Trend - REAL DATA */}
        {analytics?.dailyTrend && analytics.dailyTrend.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue Trend</Text>
            <View style={styles.chartCard}>
              <View style={styles.barChart}>
                {analytics.dailyTrend.map((day: any, index: number) => (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(day.revenue / maxRevenue) * 100}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{day.date}</Text>
                    <Text style={styles.barValue}>${day.revenue}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Peak Hours - REAL DATA */}
        {analytics?.peakHours && analytics.peakHours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peak Hours</Text>
            <View style={styles.chartCard}>
              {analytics.peakHours.map((hour: any, index: number) => (
                <View key={index} style={styles.hourRow}>
                  <Text style={styles.hourLabel}>{hour.hour}</Text>
                  <View style={styles.hourBarContainer}>
                    <View
                      style={[
                        styles.hourBar,
                        {
                          width: `${(hour.transactions / maxPeakTransactions) * 100}%`,
                          backgroundColor:
                            hour.transactions > 15
                              ? colors.success
                              : hour.transactions > 10
                              ? colors.primary
                              : colors.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.hourValue}>{hour.transactions}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Selling Items - REAL DATA */}
        {analytics?.topItems && analytics.topItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Selling Items</Text>
            <View style={styles.chartCard}>
              {analytics.topItems.map((item: any, index: number) => (
                <View key={index} style={styles.topItem}>
                  <View style={styles.topItemRank}>
                    <Text style={styles.topItemRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.topItemContent}>
                    <Text style={styles.topItemName}>{item.name}</Text>
                    <Text style={styles.topItemSales}>{item.sales} orders</Text>
                  </View>
                  <Text style={styles.topItemRevenue}>${item.revenue?.toFixed(2) || '0.00'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!analytics?.dailyTrend?.length && !analytics?.topItems?.length && (
          <View style={styles.emptyState}>
            <TrendingUp size={64} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptyMessage}>
              Analytics will appear once you start receiving orders
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  errorTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
  errorMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  exportButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  periodSelector: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.backgroundSecondary, alignItems: 'center' },
  periodBtnActive: { backgroundColor: colors.primary },
  periodBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  periodBtnTextActive: { color: '#fff' },
  scrollContent: { paddingTop: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  statCard: { width: (width - 44) / 2, backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.cardBorder },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 2 },
  trendText: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  recommendationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder },
  recIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recContent: { flex: 1, marginLeft: 12, marginRight: 8 },
  recTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  recDescription: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  recBasedOn: { fontSize: 10, color: colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  chartCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.cardBorder },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barContainer: { alignItems: 'center', flex: 1 },
  barWrapper: { height: 120, width: 28, backgroundColor: colors.backgroundSecondary, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 8 },
  barValue: { fontSize: 10, fontWeight: '600', color: colors.text, marginTop: 2 },
  hourRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  hourLabel: { width: 50, fontSize: 12, color: colors.textSecondary },
  hourBarContainer: { flex: 1, height: 20, backgroundColor: colors.backgroundSecondary, borderRadius: 6, marginHorizontal: 12, overflow: 'hidden' },
  hourBar: { height: '100%', borderRadius: 6 },
  hourValue: { width: 50, fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'right' },
  topItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  topItemRank: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  topItemRankText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  topItemContent: { flex: 1 },
  topItemName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  topItemSales: { fontSize: 12, color: colors.textSecondary },
  topItemRevenue: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});

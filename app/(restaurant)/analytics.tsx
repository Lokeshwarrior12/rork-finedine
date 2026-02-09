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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Ticket,
  TrendingUp,
  Tag,
  CheckCircle,
  DollarSign,
  Clock,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Zap,
  Target,
  Share2,
  ShoppingBag,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';
import { SalesRecommendation } from '@/types';

const { width } = Dimensions.get('window');

type Period = 'daily' | 'weekly' | 'monthly';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('weekly');
  const restaurantId = 'restaurant-123'; // Replace with actual restaurant ID from context/auth

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', restaurantId, selectedPeriod],
    queryFn: () => api.getRestaurantAnalytics(restaurantId, selectedPeriod),
  });

  const analytics = analyticsData?.data || {
    revenue: 0,
    transactions: 0,
    avgOrderValue: 0,
    redemptionRate: 0,
    newCustomers: 0,
    topItems: [],
    dailyTrend: [],
    peakHours: [],
    offerTypeDistribution: { dinein: 0, takeout: 0, both: 0 },
    discountPerformance: [],
    recommendations: [],
  };

  const stats = [
    { 
      label: 'Total Revenue', 
      value: `$${analytics.revenue?.toFixed(2) || '0.00'}`, 
      icon: DollarSign, 
      color: colors.success, 
      trend: '+18%', 
      trendUp: true 
    },
    { 
      label: 'Transactions', 
      value: analytics.transactions?.toString() || '0', 
      icon: Ticket, 
      color: colors.primary, 
      trend: '+12%', 
      trendUp: true 
    },
    { 
      label: 'Avg. Order', 
      value: `$${analytics.avgOrderValue?.toFixed(2) || '0.00'}`, 
      icon: TrendingUp, 
      color: colors.accent, 
      trend: '+5%', 
      trendUp: true 
    },
    { 
      label: 'Redemption Rate', 
      value: `${analytics.redemptionRate || 0}%`, 
      icon: CheckCircle, 
      color: colors.secondary, 
      trend: '-2%', 
      trendUp: false 
    },
  ];

  const styles = createStyles(colors, isDark);

  const maxRevenue = analytics.dailyTrend?.length > 0 
    ? Math.max(...analytics.dailyTrend.map((d: any) => d.revenue))
    : 1;
  const maxPeakTransactions = analytics.peakHours?.length > 0
    ? Math.max(...analytics.peakHours.map((h: any) => h.transactions))
    : 1;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return colors.success;
      case 'medium': return colors.warning;
      case 'low': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'timing': return Clock;
      case 'discount': return Tag;
      case 'promotion': return Zap;
      case 'inventory': return Target;
      default: return Lightbulb;
    }
  };

  const handleExport = async () => {
    const reportText = generateReport();
    try {
      await Share.share({
        message: reportText,
        title: 'Analytics Report',
      });
    } catch (error) {
      console.log('Export error:', error);
    }
  };

  const generateReport = () => {
    let report = `📊 Analytics Report - ${new Date().toLocaleDateString()}\n\n`;
    report += `📈 Key Metrics (${selectedPeriod})\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    stats.forEach(stat => {
      report += `${stat.label}: ${stat.value} (${stat.trend})\n`;
    });
    if (analytics.recommendations?.length > 0) {
      report += `\n💡 AI Recommendations\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      analytics.recommendations.forEach((rec: SalesRecommendation, i: number) => {
        report += `${i + 1}. ${rec.title}\n   ${rec.description}\n   Impact: ${rec.impact.toUpperCase()}\n\n`;
      });
    }
    return report;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statLabel, { marginTop: 16 }]}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

      <View style={styles.periodSelector}>
        {(['daily', 'weekly', 'monthly'] as const).map(period => (
          <Pressable
            key={period}
            style={[styles.periodBtn, selectedPeriod === period && styles.periodBtnActive]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[styles.periodBtnText, selectedPeriod === period && styles.periodBtnTextActive]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Stats Grid */}
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

        {/* AI Recommendations */}
        {analytics.recommendations && analytics.recommendations.length > 0 && (
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

            {analytics.recommendations.map((rec: SalesRecommendation, index: number) => {
              const TypeIcon = getTypeIcon(rec.type);
              return (
                <Pressable key={rec.id} style={styles.recommendationCard}>
                  <View style={[styles.recIcon, { backgroundColor: `${getImpactColor(rec.impact)}15` }]}>
                    <TypeIcon size={20} color={getImpactColor(rec.impact)} />
                  </View>
                  <View style={styles.recContent}>
                    <View style={styles.recHeader}>
                      <Text style={styles.recTitle}>{rec.title}</Text>
                      <View style={[styles.impactBadge, { backgroundColor: `${getImpactColor(rec.impact)}20` }]}>
                        <Text style={[styles.impactText, { color: getImpactColor(rec.impact) }]}>
                          {rec.impact}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.recDescription} numberOfLines={2}>{rec.description}</Text>
                    <Text style={styles.recBasedOn}>{rec.basedOn}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Revenue Trend */}
        {analytics.dailyTrend && analytics.dailyTrend.length > 0 && (
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
                          }
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

        {/* Peak Hours */}
        {analytics.peakHours && analytics.peakHours.length > 0 && (
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
                          backgroundColor: hour.transactions > 15 ? colors.success : 
                            hour.transactions > 10 ? colors.primary : colors.accent,
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.hourValue}>{hour.transactions} txn</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Selling Items */}
        {analytics.topItems && analytics.topItems.length > 0 && (
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

        {/* Offer Type Distribution */}
        {analytics.offerTypeDistribution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offer Type Distribution</Text>
            <View style={styles.distributionCard}>
              <View style={styles.distributionRow}>
                <View style={styles.distributionItem}>
                  <View style={[styles.distributionDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.distributionLabel}>Dine In</Text>
                </View>
                <Text style={styles.distributionValue}>{analytics.offerTypeDistribution.dinein}%</Text>
              </View>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    { width: `${analytics.offerTypeDistribution.dinein}%`, backgroundColor: colors.primary }
                  ]}
                />
              </View>

              <View style={styles.distributionRow}>
                <View style={styles.distributionItem}>
                  <View style={[styles.distributionDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.distributionLabel}>Takeout</Text>
                </View>
                <Text style={styles.distributionValue}>{analytics.offerTypeDistribution.takeout}%</Text>
              </View>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    { width: `${analytics.offerTypeDistribution.takeout}%`, backgroundColor: colors.accent }
                  ]}
                />
              </View>

              <View style={styles.distributionRow}>
                <View style={styles.distributionItem}>
                  <View style={[styles.distributionDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.distributionLabel}>Both</Text>
                </View>
                <Text style={styles.distributionValue}>{analytics.offerTypeDistribution.both}%</Text>
              </View>
              <View style={styles.distributionBar}>
                <View
                  style={[
                    styles.distributionFill,
                    { width: `${analytics.offerTypeDistribution.both}%`, backgroundColor: colors.success }
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Discount Performance */}
        {analytics.discountPerformance && analytics.discountPerformance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discount Performance</Text>
            <View style={styles.chartCard}>
              {analytics.discountPerformance.map((item: any, index: number) => (
                <View key={index} style={styles.discountRow}>
                  <View style={styles.discountLabel}>
                    <Text style={styles.discountRange}>{item.range}</Text>
                  </View>
                  <View style={styles.discountBarContainer}>
                    <View
                      style={[
                        styles.discountBar,
                        { width: `${item.conversions}%`, backgroundColor: colors.primary }
                      ]}
                    />
                  </View>
                  <View style={styles.discountStats}>
                    <Text style={styles.discountConversion}>{item.conversions}%</Text>
                    <Text style={styles.discountRevenue}>${item.revenue}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  scrollContent: {
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  recBasedOn: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 120,
    width: 28,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hourLabel: {
    width: 50,
    fontSize: 12,
    color: colors.textSecondary,
  },
  hourBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 6,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  hourBar: {
    height: '100%',
    borderRadius: 6,
  },
  hourValue: {
    width: 50,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  topItemContent: {
    flex: 1,
  },
  topItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  topItemSales: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  topItemRevenue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  distributionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  distributionLabel: {
    fontSize: 14,
    color: colors.text,
  },
  distributionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  distributionBar: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  discountLabel: {
    width: 40,
  },
  discountRange: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  discountBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 6,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  discountBar: {
    height: '100%',
    borderRadius: 6,
  },
  discountStats: {
    width: 70,
    alignItems: 'flex-end',
  },
  discountConversion: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  discountRevenue: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});

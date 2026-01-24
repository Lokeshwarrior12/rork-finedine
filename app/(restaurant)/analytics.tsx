import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { mockAnalytics } from '@/mocks/data';
import { SalesRecommendation } from '@/types';

const { width } = Dimensions.get('window');

const mockRecommendations: SalesRecommendation[] = [
  {
    id: 'rec_1',
    type: 'timing',
    title: 'Optimize Off-Peak Hours',
    description: 'Your peak sales are at 19:00. Consider offering higher discounts (40-50%) during 14:00-16:00 to boost traffic during slow periods.',
    impact: 'high',
    basedOn: 'Analysis of 156 transactions',
  },
  {
    id: 'rec_2',
    type: 'discount',
    title: 'Adjust Discount Strategy',
    description: 'Your 40% discount offers have 85% conversion rate vs 68% for 30% offers. Consider focusing on 35-40% range for optimal balance.',
    impact: 'high',
    basedOn: 'Discount rate analysis',
  },
  {
    id: 'rec_3',
    type: 'promotion',
    title: 'Boost Weekend Traffic',
    description: 'Weekend transactions are 40% lower than weekdays. Launch a "Weekend Special" with exclusive 45% discounts.',
    impact: 'medium',
    basedOn: 'Day-of-week analysis',
  },
  {
    id: 'rec_4',
    type: 'timing',
    title: 'Extended Happy Hour',
    description: 'Based on traffic patterns, extending happy hour to 3-6 PM could increase redemptions by 25%.',
    impact: 'medium',
    basedOn: 'Traffic pattern analysis',
  },
];

const mockDailyTrend = [
  { date: 'Mon', revenue: 450, transactions: 8 },
  { date: 'Tue', revenue: 380, transactions: 6 },
  { date: 'Wed', revenue: 520, transactions: 9 },
  { date: 'Thu', revenue: 610, transactions: 11 },
  { date: 'Fri', revenue: 890, transactions: 15 },
  { date: 'Sat', revenue: 720, transactions: 12 },
  { date: 'Sun', revenue: 340, transactions: 5 },
];

const mockPeakHours = [
  { hour: '12:00', transactions: 8, revenue: 480 },
  { hour: '13:00', transactions: 12, revenue: 720 },
  { hour: '18:00', transactions: 15, revenue: 900 },
  { hour: '19:00', transactions: 22, revenue: 1320 },
  { hour: '20:00', transactions: 18, revenue: 1080 },
  { hour: '21:00', transactions: 10, revenue: 600 },
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const maxRevenue = Math.max(...mockDailyTrend.map(d => d.revenue));
  const maxPeakTransactions = Math.max(...mockPeakHours.map(h => h.transactions));

  const stats = [
    { label: 'Total Revenue', value: '$3,910', icon: DollarSign, color: colors.success, trend: '+18%', trendUp: true },
    { label: 'Transactions', value: '66', icon: Ticket, color: colors.primary, trend: '+12%', trendUp: true },
    { label: 'Avg. Order', value: '$59.24', icon: TrendingUp, color: colors.accent, trend: '+5%', trendUp: true },
    { label: 'Redemption Rate', value: '78%', icon: CheckCircle, color: colors.secondary, trend: '-2%', trendUp: false },
  ];

  const styles = createStyles(colors, isDark);

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
    report += `\n💡 AI Recommendations\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    mockRecommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec.title}\n   ${rec.description}\n   Impact: ${rec.impact.toUpperCase()}\n\n`;
    });
    return report;
  };

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

          {mockRecommendations.map((rec, index) => {
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <View style={styles.chartCard}>
            <View style={styles.barChart}>
              {mockDailyTrend.map((day, index) => (
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peak Hours</Text>
          <View style={styles.chartCard}>
            {mockPeakHours.map((hour, index) => (
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offer Type Distribution</Text>
          <View style={styles.distributionCard}>
            <View style={styles.distributionRow}>
              <View style={styles.distributionItem}>
                <View style={[styles.distributionDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.distributionLabel}>Dine In</Text>
              </View>
              <Text style={styles.distributionValue}>{mockAnalytics.offerTypeDistribution.dinein}%</Text>
            </View>
            <View style={styles.distributionBar}>
              <View
                style={[
                  styles.distributionFill,
                  { width: `${mockAnalytics.offerTypeDistribution.dinein}%`, backgroundColor: colors.primary }
                ]}
              />
            </View>

            <View style={styles.distributionRow}>
              <View style={styles.distributionItem}>
                <View style={[styles.distributionDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.distributionLabel}>Takeout</Text>
              </View>
              <Text style={styles.distributionValue}>{mockAnalytics.offerTypeDistribution.takeout}%</Text>
            </View>
            <View style={styles.distributionBar}>
              <View
                style={[
                  styles.distributionFill,
                  { width: `${mockAnalytics.offerTypeDistribution.takeout}%`, backgroundColor: colors.accent }
                ]}
              />
            </View>

            <View style={styles.distributionRow}>
              <View style={styles.distributionItem}>
                <View style={[styles.distributionDot, { backgroundColor: colors.success }]} />
                <Text style={styles.distributionLabel}>Both</Text>
              </View>
              <Text style={styles.distributionValue}>{mockAnalytics.offerTypeDistribution.both}%</Text>
            </View>
            <View style={styles.distributionBar}>
              <View
                style={[
                  styles.distributionFill,
                  { width: `${mockAnalytics.offerTypeDistribution.both}%`, backgroundColor: colors.success }
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discount Performance</Text>
          <View style={styles.chartCard}>
            {[
              { range: '30%', conversions: 68, revenue: 2850 },
              { range: '35%', conversions: 72, revenue: 2660 },
              { range: '40%', conversions: 85, revenue: 2600 },
              { range: '45%', conversions: 91, revenue: 1540 },
            ].map((item, index) => (
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
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
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
    fontWeight: '700' as const,
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
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'right',
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '700' as const,
    color: colors.success,
  },
  discountRevenue: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});

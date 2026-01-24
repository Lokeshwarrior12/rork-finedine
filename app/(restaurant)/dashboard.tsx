import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Tag,
  Ticket,
  Heart,
  TrendingUp,
  Clock,
  BarChart3,
  ChevronRight,
  Package,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  QrCode,
  CalendarDays,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { deals } from '@/mocks/data';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const restaurantDeals = deals.filter(d => d.restaurantId === user?.restaurantId);
  const activeOffers = restaurantDeals.filter(d => d.isActive).length;
  const totalCouponsToday = restaurantDeals.reduce((sum, d) => sum + d.claimedCoupons, 0);
  const totalClaimed = restaurantDeals.reduce((sum, d) => sum + d.claimedCoupons, 0);

  const stats = [
    { 
      label: 'Active Offers', 
      value: activeOffers, 
      icon: Tag, 
      color: colors.primary,
      bgColor: colors.primaryLight,
      trend: '+12%',
      trendUp: true,
    },
    { 
      label: 'Coupons Today', 
      value: totalCouponsToday, 
      icon: Ticket, 
      color: colors.success,
      bgColor: colors.successLight,
      trend: '+8%',
      trendUp: true,
    },
    { 
      label: 'Total Claimed', 
      value: totalClaimed, 
      icon: TrendingUp, 
      color: colors.accent,
      bgColor: colors.accentLight,
      trend: '+23%',
      trendUp: true,
    },
    { 
      label: 'Favorites', 
      value: 156, 
      icon: Heart, 
      color: colors.error,
      bgColor: colors.errorLight,
      trend: '-2%',
      trendUp: false,
    },
  ];

  const quickActions = [
    { label: 'Scan QR', icon: QrCode, route: '/(restaurant)/scan', color: colors.success },
    { label: 'Schedule', icon: CalendarDays, route: '/(restaurant)/schedule', color: colors.primary },
    { label: 'Inventory', icon: Package, route: '/(restaurant)/inventory', color: colors.accent },
    { label: 'Analytics', icon: BarChart3, route: '/(restaurant)/analytics', color: colors.secondary },
  ];

  const recentActivity = [
    { type: 'claimed', text: 'John D. claimed "30% Off Weekend Brunch"', time: '2 min ago' },
    { type: 'claimed', text: 'Sarah M. claimed "30% Off Weekend Brunch"', time: '15 min ago' },
    { type: 'favorite', text: 'New favorite added by Mike R.', time: '1 hour ago' },
    { type: 'claimed', text: 'Emily K. claimed "20% Off Takeaway"', time: '2 hours ago' },
  ];

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  const styles = createStyles(colors, isDark);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name || 'Restaurant Owner'}</Text>
            </View>
            <Pressable 
              style={styles.notificationBtn}
              onPress={() => router.push('/(restaurant)/book-call')}
            >
              <Bell size={22} color={colors.text} />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>
          
          <Pressable 
            style={styles.createButton}
            onPress={() => navigateTo('/(restaurant)/offers')}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create New Offer</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
                  <stat.icon size={18} color={stat.color} />
                </View>
                <View style={[
                  styles.trendBadge,
                  { backgroundColor: stat.trendUp ? colors.successLight : colors.errorLight }
                ]}>
                  {stat.trendUp ? (
                    <ArrowUpRight size={12} color={colors.success} />
                  ) : (
                    <ArrowDownRight size={12} color={colors.error} />
                  )}
                  <Text style={[
                    styles.trendText,
                    { color: stat.trendUp ? colors.success : colors.error }
                  ]}>
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
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <Pressable
                key={index}
                style={styles.actionCard}
                onPress={() => action.route && navigateTo(action.route)}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Offers</Text>
            <Pressable onPress={() => navigateTo('/(restaurant)/offers')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>

          {restaurantDeals.filter(d => d.isActive).slice(0, 3).map((deal) => (
            <Pressable key={deal.id} style={styles.offerCard}>
              <View style={styles.offerLeft}>
                <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.discountText}>{deal.discountPercent}%</Text>
                </View>
                <View style={styles.offerDetails}>
                  <Text style={styles.offerTitle} numberOfLines={1}>{deal.title}</Text>
                  <View style={styles.offerMeta}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={styles.offerMetaText}>Until {deal.validTill}</Text>
                  </View>
                  <View style={styles.offerTypeBadge}>
                    <Text style={styles.offerTypeText}>
                      {deal.offerType === 'dinein' ? 'Dine-in' : 
                       deal.offerType === 'pickup' ? 'Pickup' : 'Both'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.offerStats}>
                <Text style={styles.offerStatsValue}>{deal.claimedCoupons}/{deal.maxCoupons}</Text>
                <Text style={styles.offerStatsLabel}>claimed</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${(deal.claimedCoupons / deal.maxCoupons) * 100}%`,
                        backgroundColor: colors.primary,
                      }
                    ]} 
                  />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <ChevronRight size={20} color={colors.textMuted} />
          </View>
          <View style={styles.activityCard}>
            {recentActivity.map((activity, index) => (
              <React.Fragment key={index}>
                <View style={styles.activityItem}>
                  <View style={[
                    styles.activityDot,
                    { backgroundColor: activity.type === 'claimed' ? colors.success : colors.error }
                  ]} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText} numberOfLines={1}>{activity.text}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                </View>
                {index < recentActivity.length - 1 && <View style={styles.activityDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipsIcon}>
            <TrendingUp size={24} color={colors.primary} />
          </View>
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Pro Tip</Text>
            <Text style={styles.tipsText}>
              Restaurants with 40%+ discounts see 3x more coupon claims during peak hours.
            </Text>
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
    backgroundColor: colors.surface,
    padding: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  createButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  discountBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  offerDetails: {
    marginLeft: 14,
    flex: 1,
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  offerMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  offerTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offerTypeText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  offerStats: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  offerStatsValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  offerStatsLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  activityDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 36,
  },
  tipsCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    gap: 14,
  },
  tipsIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.primary,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});

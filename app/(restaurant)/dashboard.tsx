import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
  Alert,
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
  Trash2,
  UtensilsCrossed,
  X,
  Check,
  MapPin,
  Users,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { deals } from '@/mocks/data';

const { width } = Dimensions.get('window');

interface BookingRequest {
  id: string;
  customerName: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'accepted' | 'declined';
  tableNumber?: string;
}

const mockBookingRequests: BookingRequest[] = [
  { id: '1', customerName: 'John Smith', date: 'Jan 25', time: '19:00', guests: 4, status: 'pending' },
  { id: '2', customerName: 'Sarah Johnson', date: 'Jan 25', time: '20:30', guests: 2, status: 'pending' },
  { id: '3', customerName: 'Mike Davis', date: 'Jan 26', time: '18:00', guests: 6, status: 'pending' },
];

const TABLE_OPTIONS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', '21', '22', '23', '24', '25'];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>(mockBookingRequests);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRequest | null>(null);
  const [selectedTable, setSelectedTable] = useState('');

  const restaurantDeals = deals.filter(d => d.restaurantId === user?.restaurantId);
  const activeOffers = restaurantDeals.filter(d => d.isActive).length;
  const totalCouponsToday = restaurantDeals.reduce((sum, d) => sum + d.claimedCoupons, 0);
  const totalClaimed = restaurantDeals.reduce((sum, d) => sum + d.claimedCoupons, 0);
  const pendingBookings = bookingRequests.filter(b => b.status === 'pending').length;

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
    { label: 'Waste', icon: Trash2, route: '/(restaurant)/food-waste', color: colors.error },
    { label: 'Menu', icon: UtensilsCrossed, route: '/(restaurant)/settings', color: colors.secondary },
    { label: 'Analytics', icon: BarChart3, route: '/(restaurant)/analytics', color: '#8b5cf6' },
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

  const handleBookingAction = (booking: BookingRequest) => {
    setSelectedBooking(booking);
    setSelectedTable('');
    setShowBookingModal(true);
  };

  const handleAcceptBooking = () => {
    if (!selectedTable) {
      Alert.alert('Select Table', 'Please select a table number');
      return;
    }
    if (selectedBooking) {
      setBookingRequests(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, status: 'accepted' as const, tableNumber: selectedTable }
          : b
      ));
      setShowBookingModal(false);
      Alert.alert('Booking Accepted', `Table ${selectedTable} assigned to ${selectedBooking.customerName}`);
    }
  };

  const handleDeclineBooking = () => {
    if (selectedBooking) {
      setBookingRequests(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, status: 'declined' as const }
          : b
      ));
      setShowBookingModal(false);
      Alert.alert('Booking Declined', 'The customer will be notified');
    }
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
              {pendingBookings > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{pendingBookings}</Text>
                </View>
              )}
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

        {bookingRequests.filter(b => b.status === 'pending').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Booking Requests</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingBookings} pending</Text>
              </View>
            </View>
            {bookingRequests.filter(b => b.status === 'pending').map((booking) => (
              <Pressable 
                key={booking.id} 
                style={styles.bookingCard}
                onPress={() => handleBookingAction(booking)}
              >
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingName}>{booking.customerName}</Text>
                  <View style={styles.bookingMeta}>
                    <View style={styles.bookingMetaItem}>
                      <CalendarDays size={14} color={colors.textSecondary} />
                      <Text style={styles.bookingMetaText}>{booking.date} at {booking.time}</Text>
                    </View>
                    <View style={styles.bookingMetaItem}>
                      <Users size={14} color={colors.textSecondary} />
                      <Text style={styles.bookingMetaText}>{booking.guests} guests</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.bookingActions}>
                  <Pressable 
                    style={[styles.bookingActionBtn, styles.acceptBtn]}
                    onPress={() => handleBookingAction(booking)}
                  >
                    <Check size={16} color="#fff" />
                  </Pressable>
                  <Pressable 
                    style={[styles.bookingActionBtn, styles.declineBtn]}
                    onPress={() => {
                      setSelectedBooking(booking);
                      handleDeclineBooking();
                    }}
                  >
                    <X size={16} color="#fff" />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}

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

      <Modal visible={showBookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Table</Text>
              <Pressable onPress={() => setShowBookingModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            {selectedBooking && (
              <View style={styles.bookingDetails}>
                <Text style={styles.bookingDetailName}>{selectedBooking.customerName}</Text>
                <View style={styles.bookingDetailRow}>
                  <CalendarDays size={16} color={colors.textSecondary} />
                  <Text style={styles.bookingDetailText}>
                    {selectedBooking.date} at {selectedBooking.time}
                  </Text>
                </View>
                <View style={styles.bookingDetailRow}>
                  <Users size={16} color={colors.textSecondary} />
                  <Text style={styles.bookingDetailText}>{selectedBooking.guests} guests</Text>
                </View>
              </View>
            )}

            <Text style={styles.tableLabel}>Select Table Number</Text>
            <View style={styles.tableGrid}>
              {TABLE_OPTIONS.map((table) => (
                <Pressable
                  key={table}
                  style={[
                    styles.tableOption,
                    selectedTable === table && styles.tableOptionActive,
                  ]}
                  onPress={() => setSelectedTable(table)}
                >
                  <Text style={[
                    styles.tableOptionText,
                    selectedTable === table && styles.tableOptionTextActive,
                  ]}>
                    {table}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.declineModalBtn} onPress={handleDeclineBooking}>
                <X size={18} color={colors.error} />
                <Text style={[styles.modalBtnText, { color: colors.error }]}>Decline</Text>
              </Pressable>
              <Pressable style={styles.acceptModalBtn} onPress={handleAcceptBooking}>
                <Check size={18} color="#fff" />
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
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
  pendingBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.warning,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 64) / 3,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  bookingMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  bookingMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bookingActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
  declineBtn: {
    backgroundColor: colors.error,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  bookingDetails: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  bookingDetailName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 10,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bookingDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tableLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  tableOption: {
    width: (width - 80) / 5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tableOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  tableOptionTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.errorLight,
    gap: 8,
  },
  acceptModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.success,
    gap: 8,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

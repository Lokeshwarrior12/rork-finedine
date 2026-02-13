import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  Users,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  date: string;
  time: string;
  guests: number;
  tableType: string;
  status: BookingStatus;
  specialRequests?: string;
  confirmationCode: string;
}

const mockBookings: Booking[] = [
  {
    id: 'b1',
    restaurantId: '1',
    restaurantName: 'The Golden Fork',
    restaurantImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    date: 'Jan 28, 2026',
    time: '7:00 PM',
    guests: 4,
    tableType: 'Window Seat',
    status: 'upcoming',
    specialRequests: 'Anniversary celebration - any decorations appreciated!',
    confirmationCode: 'FD-GF1234',
  },
  {
    id: 'b2',
    restaurantId: '3',
    restaurantName: 'Sakura Lounge',
    restaurantImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    date: 'Feb 14, 2026',
    time: '8:00 PM',
    guests: 2,
    tableType: 'Private Booth',
    status: 'upcoming',
    confirmationCode: 'FD-SL5678',
  },
  {
    id: 'b3',
    restaurantId: '2',
    restaurantName: 'Spice Garden',
    restaurantImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    date: 'Jan 15, 2026',
    time: '12:30 PM',
    guests: 6,
    tableType: 'Large Table',
    status: 'completed',
    confirmationCode: 'FD-SG9012',
  },
  {
    id: 'b4',
    restaurantId: '4',
    restaurantName: 'The Rooftop Bar',
    restaurantImage: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
    date: 'Jan 10, 2026',
    time: '6:00 PM',
    guests: 3,
    tableType: 'Outdoor',
    status: 'cancelled',
    confirmationCode: 'FD-RB3456',
  },
];

export default function BookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  const filteredBookings = bookings.filter(b => b.status === activeTab);

  const tabs: { key: BookingStatus; label: string; count: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: bookings.filter(b => b.status === 'upcoming').length },
    { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${booking.restaurantName}?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setBookings(prev =>
              prev.map(b => b.id === booking.id ? { ...b, status: 'cancelled' as BookingStatus } : b)
            );
          },
        },
      ]
    );
  };

  const navigateToRestaurant = (id: string) => {
    router.push(`/restaurant/${id}` as any);
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'upcoming':
        return <Clock size={14} color={Colors.primary} />;
      case 'completed':
        return <CheckCircle size={14} color={Colors.success} />;
      case 'cancelled':
        return <X size={14} color={Colors.error} />;
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'upcoming':
        return { bg: `${Colors.primary}15`, text: Colors.primary };
      case 'completed':
        return { bg: `${Colors.success}15`, text: Colors.success };
      case 'cancelled':
        return { bg: `${Colors.error}15`, text: Colors.error };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>Manage your reservations</Text>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                {tab.count}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {filteredBookings.map((booking) => {
          const statusColors = getStatusColor(booking.status);
          return (
            <Pressable
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => navigateToRestaurant(booking.restaurantId)}
            >
              <Image
                source={{ uri: booking.restaurantImage }}
                style={styles.bookingImage}
                contentFit="cover"
              />
              <View style={styles.bookingContent}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.restaurantName}>{booking.restaurantName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    {getStatusIcon(booking.status)}
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{booking.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{booking.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Users size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{booking.guests} guests</Text>
                  </View>
                </View>

                <View style={styles.bookingFooter}>
                  <View style={styles.confirmationCode}>
                    <Text style={styles.confirmationLabel}>Confirmation:</Text>
                    <Text style={styles.confirmationValue}>{booking.confirmationCode}</Text>
                  </View>
                  
                  {booking.status === 'upcoming' && (
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => handleCancelBooking(booking)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                  )}
                </View>

                {booking.specialRequests && booking.status === 'upcoming' && (
                  <View style={styles.specialRequests}>
                    <AlertCircle size={14} color={Colors.textSecondary} />
                    <Text style={styles.specialRequestsText} numberOfLines={2}>
                      {booking.specialRequests}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}

        {filteredBookings.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming'
                ? 'Book a table at your favorite restaurant'
                : `Your ${activeTab} bookings will appear here`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  tabTextActive: {
    color: Colors.surface,
  },
  tabBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bookingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingImage: {
    width: '100%',
    height: 120,
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmationCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmationLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  confirmationValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: `${Colors.error}10`,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  specialRequests: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  specialRequestsText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
